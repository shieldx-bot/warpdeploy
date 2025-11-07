import * as tf from '@tensorflow/tfjs'
import { promises as fs } from 'fs'
import path from 'path'

export class PPPOAgent {
  constructor(config) {
    this.stateDim = config.stateDim
    this.actionDim = config.actionDim
    this.gamma = config.gamma ?? 0.99
    this.lambda = config.lambda ?? 0.95
    this.clipEps = config.clipEps ?? 0.2
    this.actorLR = config.actorLR ?? 3e-4
    this.criticLR = config.criticLR ?? 1e-3
    this.entropyCoef = config.entropyCoef ?? 0.01
    this.valueCoef = config.valueCoef ?? 0.5
    this.epochs = config.epochs ?? 4
    this.batchSize = config.batchSize ?? 64

    this.actor = this.buildActor()
    this.critic = this.buildCritic()

    this.optimizer = tf.train.adam(this.actorLR)

    this.buffer = { states: [], actions: [], logprobs: [], rewards: [], dones: [], values: [] }
  }

  buildActor() {
    const m = tf.sequential()
    m.add(tf.layers.dense({ inputShape: [this.stateDim], units: 64, activation: 'relu' }))
    m.add(tf.layers.dense({ units: 64, activation: 'relu' }))
    m.add(tf.layers.dense({ units: this.actionDim }))
    return m
  }

  buildCritic() {
    const m = tf.sequential()
    m.add(tf.layers.dense({ inputShape: [this.stateDim], units: 64, activation: 'relu' }))
    m.add(tf.layers.dense({ units: 64, activation: 'relu' }))
    m.add(tf.layers.dense({ units: 1 }))
    return m
  }

  sampleAction(probs) {
    const r = Math.random()
    let cum = 0
    for (let i = 0; i < probs.length; i++) {
      cum += probs[i]
      if (r <= cum) return i
    }
    return probs.length - 1
  }

  act(state) {
    return tf.tidy(() => {
      const s = tf.tensor2d([state], [1, this.stateDim])
      const logits = this.actor.predict(s)
      const probs = tf.softmax(logits)
      const probsArr = probs.dataSync()
      const action = this.sampleAction(probsArr)
      const logprob = Math.log(Math.max(probsArr[action], 1e-8))
      const vT = this.critic.predict(s)
      const value = vT.dataSync()[0]
      return { action, logprob, value }
    })
  }

  store(state, action, logprob, reward, done, value) {
    this.buffer.states.push(state)
    this.buffer.actions.push(action)
    this.buffer.logprobs.push(logprob)
    this.buffer.rewards.push(reward)
    this.buffer.dones.push(done ? 1 : 0)
    this.buffer.values.push(value)
  }

  computeGAE() {
    const T = this.buffer.rewards.length
    const adv = new Array(T).fill(0)
    const ret = new Array(T).fill(0)
    let nextAdv = 0
    let nextVal = 0
    for (let t = T - 1; t >= 0; t--) {
      const r = this.buffer.rewards[t]
      const d = this.buffer.dones[t]
      const v = this.buffer.values[t]
      const vNext = t < T - 1 ? this.buffer.values[t + 1] : nextVal
      const delta = r + this.gamma * (1 - d) * vNext - v
      const a = delta + this.gamma * this.lambda * (1 - d) * nextAdv
      adv[t] = a
      ret[t] = a + v
      nextAdv = a
      nextVal = v
    }
    return { advantages: tf.tensor1d(adv), returns: tf.tensor1d(ret) }
  }

  ppoLoss({ states, actions, oldLogProbs, returns, advantages }) {
    return tf.tidy(() => {
      const logits = this.actor.predict(states)
      const logProbs = tf.logSoftmax(logits)
      const oneHot = tf.oneHot(actions.toInt(), this.actionDim)
      const selLog = tf.sum(logProbs.mul(oneHot), 1)
      const ratios = tf.exp(selLog.sub(oldLogProbs))
      const surr1 = ratios.mul(advantages)
      const surr2 = tf.clipByValue(ratios, 1 - this.clipEps, 1 + this.clipEps).mul(advantages)
      const actorLoss = tf.neg(tf.mean(tf.minimum(surr1, surr2)))
      const values = this.critic.predict(states).reshape([-1])
      const criticLoss = tf.mean(tf.losses.meanSquaredError(returns, values))
      const probs = tf.softmax(logits)
      const entropy = tf.mean(tf.sum(probs.mul(tf.log(tf.maximum(probs, 1e-8))), 1).mul(-1))
      return actorLoss.add(criticLoss.mul(this.valueCoef)).sub(entropy.mul(this.entropyCoef))
    })
  }

  async update() {
    const N = this.buffer.states.length
    if (N === 0) return
    const { advantages, returns } = this.computeGAE()
    const advMean = (await advantages.mean().data())[0]
    const advStd = Math.sqrt((await advantages.sub(advMean).square().mean().data())[0] + 1e-8)
    const advNorm = advantages.sub(advMean).div(advStd)
    const states = tf.tensor2d(this.buffer.states, [N, this.stateDim])
    const actions = tf.tensor1d(this.buffer.actions, 'int32')
    const oldLogProbs = tf.tensor1d(this.buffer.logprobs)
    const idx = [...Array(N).keys()]
    for (let e = 0; e < this.epochs; e++) {
      for (let i = N - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[idx[i], idx[j]] = [idx[j], idx[i]]
      }
      for (let start = 0; start < N; start += this.batchSize) {
        const end = Math.min(start + this.batchSize, N)
        const take = idx.slice(start, end)
        const mb = {
          states: tf.gather(states, take),
          actions: tf.gather(actions, take),
          oldLogProbs: tf.gather(oldLogProbs, take),
          returns: tf.gather(returns, take),
          advantages: tf.gather(advNorm, take),
        }
        await this.optimizer.minimize(() => this.ppoLoss(mb), true, [
          ...this.actor.trainableWeights.map((w) => w.val),
          ...this.critic.trainableWeights.map((w) => w.val),
        ])
        Object.values(mb).forEach((t) => t.dispose())
      }
    }
    states.dispose()
    actions.dispose()
    oldLogProbs.dispose()
    advantages.dispose()
    returns.dispose()
    this.clearBuffer()
  }

  async save(dir = './ppo-model') {
    const actorDir = path.resolve(process.cwd(), dir, 'actor')
    const criticDir = path.resolve(process.cwd(), dir, 'critic')
    await fs.mkdir(actorDir, { recursive: true })
    await fs.mkdir(criticDir, { recursive: true })
    await this.actor.save(makeLocalSaveHandler(actorDir))
    await this.critic.save(makeLocalSaveHandler(criticDir))
  }

  async load(dir = './ppo-model') {
    const actorDir = path.resolve(process.cwd(), dir, 'actor')
    const criticDir = path.resolve(process.cwd(), dir, 'critic')
    this.actor = await tf.loadLayersModel(makeLocalLoadHandler(actorDir))
    this.critic = await tf.loadLayersModel(makeLocalLoadHandler(criticDir))
  }

  clearBuffer() {
    Object.keys(this.buffer).forEach((k) => (this.buffer[k] = []))
  }
}

export const PPOAgent = PPPOAgent

function makeLocalSaveHandler(dir) {
  return {
    save: async (artifacts) => {
      const modelTopology = artifacts.modelTopology
      const weightSpecs = artifacts.weightSpecs || []
      const weightData = artifacts.weightData || new ArrayBuffer(0)
      const manifest = [{ paths: ['weights.bin'], weights: weightSpecs }]
      const modelJSON = { modelTopology, weightsManifest: manifest }
      await fs.writeFile(path.join(dir, 'model.json'), JSON.stringify(modelJSON))
      if (weightData && weightData.byteLength > 0) {
        const buf = Buffer.from(weightData)
        await fs.writeFile(path.join(dir, 'weights.bin'), buf)
      }
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: modelTopology ? JSON.stringify(modelTopology).length : 0,
          weightSpecsBytes: weightSpecs ? JSON.stringify(weightSpecs).length : 0,
          weightDataBytes: weightData ? weightData.byteLength : 0,
        },
      }
    },
  }
}

function makeLocalLoadHandler(dir) {
  return {
    load: async () => {
      const modelPath = path.join(dir, 'model.json')
      const weightsPath = path.join(dir, 'weights.bin')
      const jsonStr = await fs.readFile(modelPath, 'utf8')
      const modelJSON = JSON.parse(jsonStr)
      const weightSpecs = modelJSON.weightsManifest?.[0]?.weights || []
      let weightData = new ArrayBuffer(0)
      try {
        const bin = await fs.readFile(weightsPath)
        weightData = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength)
      } catch {}
      return { modelTopology: modelJSON.modelTopology, weightSpecs, weightData }
    },
  }
}
