import { PPOAgent } from "./agent.js"

// Feature set selection: 'basic' (5 features/node) or 'full' (17 features/node)
const FEATURE_SET = (process.env.FEATURE_SET || 'basic').toLowerCase()




// ========== 1. Cluster Simulator ==========
class ClusterSimulator {
    constructor(numNodes = 6) {
        this.numNodes = numNodes
        this.nodes = []
        this.resetCluster()
    }
    resetCluster() {
        this.nodes = Array.from({ length: this.numNodes }, (_, i) => ({
            id: i,
            totalCPU: 4 + Math.random() * 4,
            totalRAM: 8 + Math.random() * 8,
            usedCPU: 0,
            usedRAM: 0,



            DiskSpace_total: 100 + Math.random() * 100,
            DiskSpace_used: 0,

            // Dynamic metrics (simulated)
            CPUFrequency: 2.0 + Math.random() * 2.0, // in GHz (0-4)
            CPUSteal: Math.random() * 10,            // percent 0-10
            CPUIOWait: Math.random() * 100,          // ms 0-100
            DiskIOPSRead: 100 + Math.random() * 400, // 100-500
            DiskIOPSWrite: 100 + Math.random() * 400,// 100-500
            DiskLatency: 1 + Math.random() * 10,     // ms 1-11
            PingExternal: 10 + Math.random() * 90,   // ms 10-100
            PingInternal: 1 + Math.random() * 20,    // ms 1-21
            NetworkJitter: Math.random() * 10,       // ms 0-10
            BandwidthIn: 10 + Math.random() * 90,    // MB/s 10-100
            BandwidthOut: 10 + Math.random() * 90,   // MB/s 10-100
            PacketLoss: Math.random() * 2,           // percent 0-2
            TCPRetransmits: Math.random() * 50,      // per interval 0-50
            ActiveConnections: 50 + Math.random() * 950, // 50-1000
            







            pods: [],
        }))
    }
    getState() {
        const state = []
        const clamp01 = (x) => Math.max(0, Math.min(1, x))
        for (const n of this.nodes) {
            if (FEATURE_SET === 'full') {
                // Order must match server FULL_FEATURES
                const cpuFreqRatio = clamp01((n.CPUFrequency - 0.8) / (3.0 - 0.8))
                const cpuStealRatio = clamp01(n.CPUSteal / 20.0)          // assume 0-20% worst
                const cpuIoWaitRatio = clamp01(n.CPUIOWait / 200.0)       // assume up to 200ms
                const diskIopsReadRatio = clamp01(n.DiskIOPSRead / 1000)  // assume up to 1000 IOPS
                const diskIopsWriteRatio = clamp01(n.DiskIOPSWrite / 1000)
                const diskLatencyRatio = clamp01(n.DiskLatency / 50.0)    // assume 0-50ms
                const pingExternalRatio = clamp01(n.PingExternal / 200.0)  // assume 0-200ms
                const pingInternalRatio = clamp01(n.PingInternal / 50.0)   // assume 0-50ms
                const networkJitterRatio = clamp01(n.NetworkJitter / 50.0) // assume 0-50ms
                const bandwidthInRatio = clamp01(n.BandwidthIn / 1000.0)   // assume up to 1000 MB/s
                const bandwidthOutRatio = clamp01(n.BandwidthOut / 1000.0)
                const packetLossRatio = clamp01(n.PacketLoss / 5.0)        // assume 0-5%
                const tcpRetransmitsRatio = clamp01(n.TCPRetransmits / 200)// assume up to 200
                const activeConnectionsRatio = clamp01(n.ActiveConnections / 5000)// up to 5k
                const cpuRatio = n.usedCPU / n.totalCPU
                const ramRatio = n.usedRAM / n.totalRAM
                const diskRatio = n.DiskSpace_used / n.DiskSpace_total
                state.push(
                    cpuFreqRatio,cpuStealRatio,cpuIoWaitRatio,diskIopsReadRatio,diskIopsWriteRatio,diskLatencyRatio,
                    pingExternalRatio,pingInternalRatio,networkJitterRatio,bandwidthInRatio,bandwidthOutRatio,packetLossRatio,
                    tcpRetransmitsRatio,activeConnectionsRatio,cpuRatio,ramRatio,diskRatio
                )
            } else {
                // basic
                state.push(n.usedCPU / n.totalCPU)
                state.push(n.usedRAM / n.totalRAM)
                state.push(n.DiskSpace_used / n.DiskSpace_total)
                const CPUFrequencyRatio = Math.min(1.0, n.CPUFrequency / 4.0)
                state.push(CPUFrequencyRatio)
                state.push(n.pods.length)
            }
        }
        return state
    }
    canFit(nodeId, cpuReq, ramReq, diskReq = 0) {
        const n = this.nodes[nodeId]
        const  resourcesFit = n.usedCPU + cpuReq <= n.totalCPU && 
                              n.usedRAM + ramReq <= n.totalRAM && 
                            n.DiskSpace_used + diskReq <= n.DiskSpace_total;
        const CPUFrequencyOk = n.CPUFrequency >= 1.5; 
        return resourcesFit && CPUFrequencyOk;
    }
    schedulePod(nodeId, pod) {
        if (!this.canFit(nodeId, pod.cpu, pod.ram, pod.DiskSpace)) return { success: false, responseTime: Infinity }
        const n = this.nodes[nodeId]
        n.usedCPU += pod.cpu
        n.usedRAM += pod.ram
        n.DiskSpace_used += pod.DiskSpace;
        n.pods.push(pod)
        const cpuUtil = n.usedCPU / n.totalCPU
        const ramUtil = n.usedRAM / n.totalRAM
        const diskUtil = n.DiskSpace_used / n.DiskSpace_total

        const baseTime = 100
        const penalty = Math.max(cpuUtil, ramUtil, diskUtil ) ** 2 * 200
        const norm = (v, max) => Math.max(0, Math.min(1, v / max));
        const cpuFreqRatio = norm(n.CPUFrequency, 4.0);
        const cpuStealRatio = norm(n.CPUSteal, 20.0);
        const cpuIoWaitRatio = norm(n.CPUIOWait, 200.0);
        const diskIopsReadRatio = norm(n.DiskIOPSRead, 1000);
        const diskIopsWriteRatio = norm(n.DiskIOPSWrite, 1000);
        const diskLatencyRatio = norm(n.DiskLatency, 50.0);
        const pingExternalRatio = norm(n.PingExternal, 200.0);
        const pingInternalRatio = norm(n.PingInternal, 50.0);
        const networkJitterRatio = norm(n.NetworkJitter, 50.0);
        const bandwidthInRatio = norm(n.BandwidthIn, 1000.0);
        const bandwidthOutRatio = norm(n.BandwidthOut, 1000.0);
        const packetLossRatio = norm(n.PacketLoss, 5.0);
        const tcpRetransmitsRatio = norm(n.TCPRetransmits, 200);
        const activeConnectionsRatio = norm(n.ActiveConnections, 5000);
        // Nhóm tín hiệu động
        const cpuDyn = (cpuStealRatio + cpuIoWaitRatio) / 2;                 // áp lực CPU
        const diskDyn = diskLatencyRatio;                                     // độ trễ đĩa
        const netLatency = (pingExternalRatio + pingInternalRatio) / 2;       // độ trễ mạng
        const netReliability = (networkJitterRatio + packetLossRatio + tcpRetransmitsRatio) / 3; // ổn định mạng
        const netThroughput = (bandwidthInRatio + bandwidthOutRatio) / 2;     // mức tiêu thụ băng thông (cao = áp lực)
        const connPressure = activeConnectionsRatio;                           // áp lực kết nối
        const freqPenalty = Math.max(0, 1 - cpuFreqRatio);                     // xung thấp = phạt cao

        // Trọng số (tổng = 1.0), có thể tinh chỉnh theo nhu cầu
        const w_cpu = 0.20, w_disk = 0.20, w_netLat = 0.20, w_netRel = 0.15, w_bw = 0.10, w_conn = 0.05, w_freq = 0.10;

        const dynamicPenalty = (
            w_cpu * cpuDyn +
            w_disk * diskDyn +
            w_netLat * netLatency +
            w_netRel * netReliability +
            w_bw * netThroughput +
            w_conn * connPressure +
            w_freq * freqPenalty
        ) * 100;
        const totalPenalty = penalty + dynamicPenalty
        const responseTime = baseTime + totalPenalty + Math.random() * 50
         // evolve dynamic metrics slightly (random walk) to simulate changes
        const jitter = () => (Math.random() - 0.5)
        n.CPUFrequency = Math.max(0.5, Math.min(4.0, n.CPUFrequency + 0.05 * jitter()))
        n.CPUSteal = Math.max(0, Math.min(20, n.CPUSteal + 0.5 * jitter()))
        n.CPUIOWait = Math.max(0, Math.min(200, n.CPUIOWait + 2 * jitter()))
        n.DiskIOPSRead = Math.max(10, Math.min(1000, n.DiskIOPSRead + 10 * jitter()))
        n.DiskIOPSWrite = Math.max(10, Math.min(1000, n.DiskIOPSWrite + 10 * jitter()))
        n.DiskLatency = Math.max(0.1, Math.min(50, n.DiskLatency + 0.5 * jitter()))
        n.PingExternal = Math.max(5, Math.min(200, n.PingExternal + 2 * jitter()))
        n.PingInternal = Math.max(0.5, Math.min(50, n.PingInternal + 1 * jitter()))
        n.NetworkJitter = Math.max(0, Math.min(50, n.NetworkJitter + 1 * jitter()))
        n.BandwidthIn = Math.max(1, Math.min(1000, n.BandwidthIn + 5 * jitter()))
        n.BandwidthOut = Math.max(1, Math.min(1000, n.BandwidthOut + 5 * jitter()))
        n.PacketLoss = Math.max(0, Math.min(5, n.PacketLoss + 0.1 * jitter()))
        n.TCPRetransmits = Math.max(0, Math.min(200, n.TCPRetransmits + 1 * jitter()))
        n.ActiveConnections = Math.max(0, Math.min(5000, n.ActiveConnections + 20 * jitter()))
        return { success: true, responseTime }
    }
    getAverageResponseTime() {
        let total = 0,
            count = 0
        for (const n of this.nodes) {
            for (const p of n.pods) {
                if (p.responseTime) {
                    total += p.responseTime
                    count++
                }
            }
        }
        return count > 0 ? total / count : 0
    }
}

// ========== 2. Pod Generator ==========
function generatePod(id) {
    return { id,
        cpu: 0.5 + Math.random() * 1.5,
        ram: 1 + Math.random() * 3, 
        DiskSpace: 2 + Math.random() * 8,
        duration: 5 + Math.floor(Math.random() * 10),

     }
}

// ========== 3. Reward Function ==========
function computeReward(responseTime, cluster) {
    const targetRT = 150
    const rewardRT = Math.max(-1, 1 - responseTime / targetRT)
    const utils = cluster.nodes.map((n) => {
        const cpuUtil = n.usedCPU / n.totalCPU;
        const ramUtil = n.usedRAM / n.totalRAM;
        const diskUtil = n.DiskSpace_used / n.DiskSpace_total;
        const load = (cpuUtil + ramUtil + diskUtil) / 3;
        return load;
    })
    const mean = utils.reduce((a, b) => a + b, 0) / utils.length
    const std = Math.sqrt(utils.reduce((a, u) => a + (u - mean) ** 2, 0) / utils.length)
    const balanceBonus = Math.max(0, 0.2 * (1 - std))
    return rewardRT + balanceBonus
}

// ========== 4. Training Loop ==========
async function train() {
    const numNodes = 5
    // Build cluster first to derive exact state dimension dynamically
    const cluster = new ClusterSimulator(numNodes)
    const stateDim = cluster.getState().length
    const actionDim = numNodes
    const agent = new PPOAgent({
        stateDim,
        actionDim,
        gamma: 0.99,
        lambda: 0.95,
        clipEps: 0.2,
        actorLR: 3e-4,
        criticLR: 1e-3,
        entropyCoef: 0.01,
        valueCoef: 0.5,
        epochs: 4,
        batchSize: 64,
    })
    // cluster already created above
        const numEpisodes = Number(process.env.EPISODES || 5000)
        const podsPerEpisode = Number(process.env.PODS || 500)
        const saveInterval = Number(process.env.SAVE_INTERVAL || 50)
    console.log('🚀 Starting PPO training for pod scheduling...')
    for (let episode = 1; episode <= numEpisodes; episode++) {
        cluster.resetCluster()
        let episodeReward = 0
        let episodeSteps = 0
        for (let step = 0; step < podsPerEpisode; step++) {
            const pod = generatePod(step)
            const state = cluster.getState()
            const { action, logprob, value } = agent.act(state)
            const result = cluster.schedulePod(action, pod)
            let reward = 0,
                done = false
            if (result.success) {
                pod.responseTime = result.responseTime
                reward = computeReward(result.responseTime, cluster)
            } else {
                reward = -1
                done = true
            }
            agent.store(state, action, logprob, reward, done, value)
            episodeReward += reward
            episodeSteps++
            if (done) break
        }
        await agent.update()
        if (episode % saveInterval === 0) {
            const prefix = FEATURE_SET === 'full' ? 'ppo_pod_scheduler_full' : 'ppo_pod_scheduler'
            await agent.save(`./models/${prefix}_episode_${episode}`)
            console.log(`✅ Model saved at episode ${episode}. Reward=${episodeReward.toFixed(2)} Steps=${episodeSteps}`)
        } else {
            console.log(`📊 Episode ${episode}: reward=${episodeReward.toFixed(2)} steps=${episodeSteps} avgRT=${cluster
                .getAverageResponseTime()
                .toFixed(1)}ms`)
        }
    }
    console.log('🏆 Training complete')
    const finalName = FEATURE_SET === 'full' ? 'ppo_pod_scheduler_full_final' : 'ppo_pod_scheduler_final'
    await agent.save(`./models/${finalName}`)
    console.log('✅ Final model saved.')
}

// ========== 5. Evaluation (optional) ==========
async function evaluate() {
    const numNodes = 5
    const cluster = new ClusterSimulator(numNodes)
    const stateDim = cluster.getState().length
    const actionDim = numNodes
    const agent = new PPOAgent({ stateDim, actionDim })
    const finalName = FEATURE_SET === 'full' ? 'ppo_pod_scheduler_full_final' : 'ppo_pod_scheduler_final'
    await agent.load(`./models/${finalName}`)
    cluster.resetCluster()
    console.log('Evaluating trained PPO agent...')
    let totalReward = 0
    const numPods = 50
    for (let i = 0; i < numPods; i++) {
        const pod = generatePod(i)
        const state = cluster.getState()
        const { action } = agent.act(state)
        const result = cluster.schedulePod(action, pod)
        if (result.success) {
            pod.responseTime = result.responseTime
            totalReward += computeReward(result.responseTime, cluster)
            console.log(`Pod ${i} → Node ${action} RT=${result.responseTime.toFixed(1)}ms`)
        } else {
            console.log(`Pod ${i} → Node ${action} FAILED`)
            totalReward -= 1
        }
    }
    console.log(`\n📈 Avg Reward: ${(totalReward / numPods).toFixed(2)}`)
    console.log(`📈 Avg Response Time: ${cluster.getAverageResponseTime().toFixed(1)}ms`)
}

;(async () => {
    const mode = process.argv[2] || 'train'
    if (mode === 'train') await train()
    else if (mode === 'eval' || mode === 'evaluate') await evaluate()
    else console.log('Usage: node trainer.js [train|eval]')
})()


// chore: no-op touch (commit 15/15) – 2025-11-12


