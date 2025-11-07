import express from 'express'
import { PPOAgent } from './agent.js'

// Helpers
const clamp01 = (x) => Math.max(0, Math.min(1, x))
const normalizeMinMax = (cur, min, max) => {
	const d = (max - min) || 1
	return clamp01(((cur ?? min) - min) / d)
}
const ratioUsedTotal = (used, total) => clamp01((used || 0) / ((total || 0) || 1))

// Config
const NUM_NODES = Number(process.env.NUM_NODES || 5)
const FEATURE_SET = (process.env.FEATURE_SET || 'basic').toLowerCase() // 'basic' or 'full'

// Basic features (match trainer): per node 5
const BASIC_FEATURES = ['cpuRatio','ramRatio','diskRatio','cpuFreqRatio','podsCount']

// Full features (match environment.getState order): per node 17
const FULL_FEATURES = [
	'cpuFreqRatio','cpuStealRatio','cpuIoWaitRatio','diskIopsReadRatio','diskIopsWriteRatio','diskLatencyRatio',
	'pingExternalRatio','pingInternalRatio','networkJitterRatio','bandwidthInRatio','bandwidthOutRatio','packetLossRatio',
	'tcpRetransmitsRatio','activeConnectionsRatio','cpuRatio','ramRatio','diskRatio'
]

function buildBasicState(nodes) {
	const state = []
	for (const n of nodes) {
		const cpuRatio = ratioUsedTotal(n.used_cpu, n.total_cpu)
		const ramRatio = ratioUsedTotal(n.used_ram, n.total_ram)
		const diskRatio = ratioUsedTotal(n.DiskSpace_used, n.DiskSpace_total)
		let cpuFreqRatio = 0.5
		if (n.CPUFrequency_min != null && n.CPUFrequency_max != null && n.CPUFrequency_current != null) {
			cpuFreqRatio = normalizeMinMax(Number(n.CPUFrequency_current), Number(n.CPUFrequency_min), Number(n.CPUFrequency_max))
		} else if (n.CPUFrequency != null) {
			cpuFreqRatio = clamp01(Number(n.CPUFrequency) / 4.0)
		}
		const podsCount = Number(n.pods_count ?? n.queue_length ?? n.pods?.length ?? 0)
		state.push(cpuRatio, ramRatio, diskRatio, cpuFreqRatio, podsCount)
	}
	return state
}

function normTri(n, curK, minK, maxK) {
	const cur = Number(n?.[curK])
	const min = Number(n?.[minK])
	const max = Number(n?.[maxK])
	if ([cur,min,max].every((v) => Number.isFinite(v))) return normalizeMinMax(cur, min, max)
	return 0.5
}

function buildFullState(nodes) {
	const state = []
	for (const n of nodes) {
		const cpuFreqRatio = normTri(n,'CPUFrequency_current','CPUFrequency_min','CPUFrequency_max')
		const cpuStealRatio = normTri(n,'CPUSteal_current','CPUSteal_min','CPUSteal_max')
		const cpuIoWaitRatio = normTri(n,'CPUIOWait_current','CPUIOWait_min','CPUIOWait_max')
		const diskIopsReadRatio = normTri(n,'DiskIOPSRead_current','DiskIOPSRead_min','DiskIOPSRead_max')
		const diskIopsWriteRatio = normTri(n,'DiskIOPSWrite_current','DiskIOPSWrite_min','DiskIOPSWrite_max')
		const diskLatencyRatio = normTri(n,'DiskLatency_current','DiskLatency_min','DiskLatency_max')
		const pingExternalRatio = normTri(n,'PingExternal_avg','PingExternal_min','PingExternal_max')
		const pingInternalRatio = normTri(n,'PingInternal_avg','PingInternal_min','PingInternal_max')
		const networkJitterRatio = normTri(n,'NetworkJitter_current','NetworkJitter_min','NetworkJitter_max')
		const bandwidthInRatio = normTri(n,'BandwidthIn_current','BandwidthIn_min','BandwidthIn_max')
		const bandwidthOutRatio = normTri(n,'BandwidthOut_current','BandwidthOut_min','BandwidthOut_max')
		const packetLossRatio = normTri(n,'PacketLoss_current','PacketLoss_min','PacketLoss_max')
		const tcpRetransmitsRatio = normTri(n,'TCPRetransmits_current','TCPRetransmits_min','TCPRetransmits_max')
		const activeConnectionsRatio = normTri(n,'ActiveConnections_current','ActiveConnections_min','ActiveConnections_max')
		const cpuRatio = ratioUsedTotal(n.used_cpu, n.total_cpu)
		const ramRatio = ratioUsedTotal(n.used_ram, n.total_ram)
		const diskRatio = ratioUsedTotal(n.DiskSpace_used, n.DiskSpace_total)
		state.push(
			cpuFreqRatio,cpuStealRatio,cpuIoWaitRatio,diskIopsReadRatio,diskIopsWriteRatio,diskLatencyRatio,
			pingExternalRatio,pingInternalRatio,networkJitterRatio,bandwidthInRatio,bandwidthOutRatio,packetLossRatio,
			tcpRetransmitsRatio,activeConnectionsRatio,cpuRatio,ramRatio,diskRatio
		)
	}
	return state
}

const app = express()
app.use(express.json({ limit: '1mb' }))

let agent = null
let modelLoaded = false
let featuresPerNode = FEATURE_SET === 'full' ? FULL_FEATURES.length : BASIC_FEATURES.length
let stateDim = NUM_NODES * featuresPerNode
let actionDim = NUM_NODES

async function initAgent() {
	agent = new PPOAgent({ stateDim, actionDim })
	const modelPath = FEATURE_SET === 'full'
		? './models/ppo_pod_scheduler_full_final'
		: './models/ppo_pod_scheduler_final'
	try {
		await agent.load(modelPath)
		modelLoaded = true
		console.log(`✅ Model loaded (${FEATURE_SET}) (stateDim=${stateDim}, actionDim=${actionDim})`)
	} catch (e) {
		console.warn(`⚠️ Failed to load model for feature set '${FEATURE_SET}', continuing with untrained weights:`, e?.message || e)
		modelLoaded = true
	}
}

app.get('/health', (req, res) => {
	res.json({ status: 'ok', modelLoaded, featureSet: FEATURE_SET, stateDim, actionDim, featuresPerNode })
})

app.get('/features', (req, res) => {
	res.json({ featureSet: FEATURE_SET, perNode: FEATURE_SET === 'full' ? FULL_FEATURES : BASIC_FEATURES })
})

app.post('/schedule', (req, res) => {
	try {
		if (!modelLoaded) return res.status(503).json({ error: 'Model not ready' })
		const nodes = Array.isArray(req.body?.nodes) ? req.body.nodes : null
		if (!nodes) return res.status(400).json({ error: 'Missing nodes array' })
		if (nodes.length !== NUM_NODES) return res.status(400).json({ error: `Expected ${NUM_NODES} nodes, got ${nodes.length}` })

		const state = FEATURE_SET === 'full' ? buildFullState(nodes) : buildBasicState(nodes)
		if (state.length !== stateDim) return res.status(400).json({ error: `State length mismatch: expected ${stateDim}, got ${state.length}` })

		const { action, logprob, value } = agent.act(state)
		const idx = Number(action)
		const chosen = nodes[idx]
		return res.json({ nodeIndex: idx, nodeName: chosen?.name ?? `node-${idx}`, logprob, value, state })
	} catch (e) {
		console.error('schedule error:', e)
		return res.status(500).json({ error: e?.message || String(e) })
	}
})

const PORT = Number(process.env.PORT || 4040)
initAgent().then(() => {
	app.listen(PORT, () => console.log(`🚀 Express PPO Scheduler on http://localhost:${PORT} (features=${FEATURE_SET}, nodes=${NUM_NODES})`))
})

