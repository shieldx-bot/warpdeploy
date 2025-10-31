import { activation } from '@tensorflow/tfjs-layers/dist/exports_layers';
import * as tf from '@tensorflow/tfjs-node';

export class PPPOAgent { 
  constructor(config){
    this.stateDim = config.stateDim;
    this.actionDim = config.actionDim;
    this.gamma = config.gamma || 0.99;
    this.lambda = config.lambda || 0.95;
    this.clipEps = config.clipEps || 0.2;

    this.actorLR = config.actorLR ||  3e-4;
    this.critic = config.critic ||  1e-3;
    this.entropyCoef = config.entropyCoef || 0.01;
    this.valueCoef = config.valueCoef || 0.5;
    this.epochs = config.epochs || 4
    this.batchSize = config.batchSize || 64;


    this.actor = this.buildActor();
    this.critic = this.buildCritic();


    this.optimizer  = tf.train.adam(this.actorLR);
    this.buffer = {
      states: [],
      actions: [],
      rewards: [],
      rewards: [],
      dones: [],
      values : [],
      logProbs: []

  };
  }

  buildActor(){
    const model = tf.sequential();
    model.add(tf.layers.dense({inputShape: [this.stateDim], units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: this.actionDim}))
    return model;
  }

  buildCritic(){
    const model  = tf.sequential();
    model.add(tf.layers.dense({inputShape: [this.stateDim], units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 1}));
    return model;
  }

  sampleAction(probs){
    const r = Math.random();
    let cum = 0;
    for(let i =0 ; i < probs.length; i++){
      cum += probs[i];
      if(r <= cum){
        return i;
      }
      return probs.length -1;
    }
  }

  act(state){ 
    return tf.tidy(()=>{
      const stateTensor = tf.tensor2d([state], [1, this.stateDim]);
      const logits = this.actor.predict(stateTensor);
      const probsArr = tf.softmax(logits).dataSync();
      const action = this.sampleAction(probsArr);
      const logprob = math.log(Math.max(probsArr[action], 1e-10));

      const valueTensor = this.critic.predict(stateTensor);
      const value = valueTensor.dataSync()[0];
      return { action, logprob, value };
    })
  }
  store(state, action, logprob, reward, done, value){
    this.buffer.states.push(state);
    this.buffer.actions.push(action);
    this.buffer.logProbs.push(logprob);
    this.buffer.rewards.push(reward);
    this.buffer.dones.push(done);
    this.buffer.values.push(value);
  }

  computeGAE(){
    const T = this.buffer.rewards.length;
    const advantages = new Array(T).fill(0);
    const returns = new Array(T).fill(0);
    let nextAdv = 0;
    let nextValue = 0;
    for(let t = T -1; t >= 0; t--){ 
      const rt = this.buffer.rewards[t];
      const dt = this.buffer.dones[t] ? 0 : 1;
      const vt = this.buffer.values[t];

      const vNext = t < T -1 ? this.buffer.values[t +1] : nextValue;
      const delta = rt + this.gamma * ( 1 -dt ) *  vNext - vt;
      const at = delta + this.gamma * this.lambda * (1 - dt) * nextAdv;
      advantages[t] = at;
      returns[t] = at + vt;
      nextAdv = at;
      nextValue = vt;

    }
    return { 
      advantages: tf.tensor1d(advantages) , 
      returns: tf.tensor1d(returns)
    }
  }


  ppoloss(minibatch){
    const {state, actions, oldLogProbs, returns, advantages} = minibatch
    return tf.tidy(()=>{
      const logits = this.actor.predict(states);
      const logProbs = tf.logSoftmax(logits);


            // select logprob of taken actions
      const oneHot = tf.oneHot(actions.toInt(), this.actionDim);
      const selectedLogProbs = tf.sum(logProbs.mul(oneHot) , 1)
      const ratios = tf.exp(selectedLogProbs.sub(oldLogProbs));
      const surr1 = ratios.mul(advantages);
      const surr2 = tf.clipByValue(ratios, 1 - this.clipEps, 1 + this.clipEps).mul(advantages);
      const actorLoss = tf.neg(tf.mean(tf.minimum(surr1, surr2)));
      const values = this.critic.predict(states).reshape([-1]);
      const criticLoss = tf.mean(tf.losses.meanSquareError(returns, values));

      const probs = tf.softmax(logits);
      const entropy = tf.mean(tf.sum(props.mul(tf.log(tf.maximum(probs, 1e-8))),1).mul(-1));

      const total = actorLoss
      .add(criticLoss.mul(this.valueCoef))
      .sub(entropy.mul(this.entropyCoef));


      return total;
    })
  }

  async update(){ 
    const N = this.buffer.states.length;
    if(N === 0) return;
    const {advantages, returns} = this.computeGAE();



    //Normailize advantages
    const advMean = (await advantages.main().data())[0];
    const advStd = Math.sqrt((await advantages.sub(advMean).square().mean().data())[0] + 1e-8);
    const advNorm = advantages.sub(advMean).div(advStd);


    const states = tf.tensor2d(this.buffer.states, [N, this.stateDim]);
    const actions = tf.tensor1d(this.buffer.actions, "int32");
    const oldLogProbs = tf.tensor1d(this.buffer.logProbs);

    const idx = [...Array(N).keys()];
    // shuffle indices
    for(let i = N -1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    for(let start = 0; start < N; start += this.batchSize){
      const end = Math.min(start + this.batchSize, N); 
      const take = idx.slice(start, end);

      const mb =  {
        states: tf.gather(states, take), 
        actions: tf.gather(actions, take),
        oldLogProbs: tf.gather(oldLogProbs, take), 
        returns: tf.gather(actions, take), 
        advantages:  tf.gather(advNorm,  take)

      }

      await this.optimizer.minimize(() => this.ppoLoss(mb), true, [
          ...this.actor.trainableWeights.map(w => w.val),
          ...this.critic.trainableWeights.map(w => w.val),
        ]);    
       Object.values(mb).forEach(t => t.dispose());

      }
      states.dispose();
      actions.dispose();
      oldLogProbs.dispose();
      advantages.dispose();
      returns.dispose();
      this.clearBuffer();

  }


  async save(dir="./ppo-model") { 
    await this.actor.save(`file://${dir}/actor`);
    await this.critic.save(`file://${dir}/critic`);
  }

  
   async load(dir = "./ppo-model") {
    this.actor = await tf.loadLayersModel(`file://${dir}/actor/model.json`);
    this.critic = await tf.loadLayersModel(`file://${dir}/critic/model.json`);
  }
  clearBuffer(){
    Object.keys(this.buffer).forEach(k => (this.buffer[k] = []));
  }
}

export const PPOAgent = PPPOAgent