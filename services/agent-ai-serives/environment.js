export class NodeSim { 
    constructor( 
        ActiveConnections_current,
        ActiveConnections_max,
        ActiveConnections_min,
        TCPRetransmits_current,
        TCPRetransmits_max,
        TCPRetransmits_min,
        PacketLoss_current,
        PacketLoss_max,
        PacketLoss_min,
        BandwidthOut_current, 
        BandwidthOut_max,
        BandwidthOut_min,
        BandwidthIn_current, 
        BandwidthIn_max,
        BandwidthIn_min,
        NetworkJitter_current, 
        NetworkJitter_max,
        NetworkJitter_min,  
        PingInternal_avg, 
        PingInternal_max , 
        PingInternal_min,   
        PingExternal_avg,  
        PingExternal_max,  
        PingExternal_min,  
        DiskLatency_current  , 
        DiskLatency_max,
        DiskLatency_min,
        DiskIOPSWrite_current, 
        DiskIOPSWrite_max,
        DiskIOPSWrite_min,
        DiskIOPSRead_current,  
        DiskIOPSRead_max,
        DiskIOPSRead_min, 
        DiskSpace_total, 
        DiskSpace_used ,
        CPUIOWait_current ,
        CPUIOWait_max,
        CPUIOWait_min,
        CPUSteal_current, 
        CPUSteal_max,
        CPUSteal_min,
        CPUFrequency_current,
        CPUFrequency_max,
        CPUFrequency_min, 
        id, CPUCores_total , CPUCores_used, RAM_total , RAM_used) { 
        this.id = id;
        this.total_cpu = CPUCores_total;
        this.used_cpu = CPUCores_used;

        this.total_ram = RAM_total;
        this.used_ram = RAM_used;

    // CPUFrequency in MHz (ensure min/max/current use the same unit)
        this.CPUFrequency_current = CPUFrequency_current;
        this.CPUFrequency_max = CPUFrequency_max; 
        this.CPUFrequency_min = CPUFrequency_min;

        //CPUSteal in percentage
        this.CPUSteal_current = CPUSteal_current;
        this.CPUSteal_max = CPUSteal_max;
        this.CPUSteal_min = CPUSteal_min;

        // CPUIOWait in percentage
        this.CPUIOWait_current = CPUIOWait_current;
        this.CPUIOWait_max = CPUIOWait_max;
        this.CPUIOWait_min = CPUIOWait_min;

        // DiskSpace in GB
        this.DiskSpace_total = DiskSpace_total;
        this.DiskSpace_used = DiskSpace_used;


        //DiskIOPSRead  in IOPS
        this.DiskIOPSRead_current = DiskIOPSRead_current;
        this.DiskIOPSRead_max = DiskIOPSRead_max;
        this.DiskIOPSRead_min = DiskIOPSRead_min;

        //DiskIOPSWrite in IOPS
        this.DiskIOPSWrite_current = DiskIOPSWrite_current;
        this.DiskIOPSWrite_max =  DiskIOPSWrite_max;
        this.DiskIOPSWrite_min = DiskIOPSWrite_min;


        // DiskLatency in ms
        this.DiskLatency_current = DiskLatency_current;
        this.DiskLatency_max = DiskLatency_max;
        this.DiskLatency_min = DiskLatency_min;


        //   PingExternal in ms
        this.PingExternal_avg =  PingExternal_avg;
        this.PingExternal_max =  PingExternal_max;
        this.PingExternal_min =  PingExternal_min;


        //PingInternal in ms
        this.PingInternal_avg =  PingInternal_avg;
        this.PingInternal_max =  PingInternal_max;
        this.PingInternal_min =  PingInternal_min;

        // NetworkJitter in ms
        this.NetworkJitter_current = NetworkJitter_current;
        this.NetworkJitter_max =  NetworkJitter_max;
        this.NetworkJitter_min =  NetworkJitter_min;


        // BandwidthIn in Mbps
        this.BandwidthIn_current = BandwidthIn_current;
        this.BandwidthIn_max = BandwidthIn_max;
        this.BandwidthIn_min = BandwidthIn_min;

        // BandwidthOut in Mbps
        this.BandwidthOut_current = BandwidthOut_current;
        this.BandwidthOut_max = BandwidthOut_max;
        this.BandwidthOut_min = BandwidthOut_min;

        // PacketLoss in percentage

        this.PacketLoss_current = PacketLoss_current;
        this.PacketLoss_max = PacketLoss_max;
        this.PacketLoss_min = PacketLoss_min;

        // TCPRetransmits in percentage
        this.TCPRetransmits_current = TCPRetransmits_current;
        this.TCPRetransmits_max = TCPRetransmits_max;
        this.TCPRetransmits_min = TCPRetransmits_min;

        // ActiveConnections in number
        this.ActiveConnections_current = ActiveConnections_current;
        this.ActiveConnections_max = ActiveConnections_max;
        this.ActiveConnections_min = ActiveConnections_min;
        this.queue = [];
    }

    free_cpu() {
        return this.total_cpu - this.used_cpu;
    }
    free_ram(){ 
        return this.total_ram - this.used_ram;
    }
    free_disk(){ 
        return this.DiskSpace_total - this.DiskSpace_used;
    }

    // Static ratio: Disk used / total
    getDiskSpaceRatio(){
        const denom = this.DiskSpace_total || 1;
        return Math.max(0, Math.min(1, (this.DiskSpace_used || 0) / denom));
    }

    getCPUStealRatio(){ 
        const denom = (this.CPUSteal_max - this.CPUSteal_min) || 1;
        const normal = (this.CPUSteal_current - this.CPUSteal_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }

    getCPUFrequencyRatio(){ 
        const denom = (this.CPUFrequency_max - this.CPUFrequency_min) || 1;
        const normal = (this.CPUFrequency_current - this.CPUFrequency_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getCPUIOWaitRatio(){ 
        const denom = (this.CPUIOWait_max - this.CPUIOWait_min) || 1;
        const normal = (this.CPUIOWait_current - this.CPUIOWait_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getDiskIOPSReadRatio() {
        const denom = (this.DiskIOPSRead_max - this.DiskIOPSRead_min) || 1;
        const normal = (this.DiskIOPSRead_current - this.DiskIOPSRead_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getDiskIOPSWriteRatio() { 
        const denom = (this.DiskIOPSWrite_max - this.DiskIOPSWrite_min) || 1;
        const normal = (this.DiskIOPSWrite_current - this.DiskIOPSWrite_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getDiskLatencyRatio(){ 
        const denom = (this.DiskLatency_max - this.DiskLatency_min) || 1;
        const normal = (this.DiskLatency_current - this.DiskLatency_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getPingExternalRatio(){
        const denom = (this.PingExternal_max - this.PingExternal_min) || 1;
        const normal = (this.PingExternal_avg - this.PingExternal_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getPingInternalRatio(){ 
        const denom = (this.PingInternal_max - this.PingInternal_min) || 1;
        const normal = (this.PingInternal_avg - this.PingInternal_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getNetworkJitterRatio(){
        const denom = (this.NetworkJitter_max - this.NetworkJitter_min) || 1;
        const normal = (this.NetworkJitter_current - this.NetworkJitter_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getBandwidthInRatio(){
        const denom = (this.BandwidthIn_max - this.BandwidthIn_min) || 1;
        const normal = (this.BandwidthIn_current - this.BandwidthIn_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getBandwidthOutRatio(){ 
        const denom = (this.BandwidthOut_max - this.BandwidthOut_min) || 1;
        const normal = (this.BandwidthOut_current - this.BandwidthOut_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getPacketLossRatio(){ 
        const denom = (this.PacketLoss_max - this.PacketLoss_min) || 1;
        const normal = (this.PacketLoss_current - this.PacketLoss_min) / denom; 
        return Math.max(0, Math.min(1, normal));
    }
    getTCPRetransmitsRatio(){
        const denom = (this.TCPRetransmits_max - this.TCPRetransmits_min) || 1;
        const normal = (this.TCPRetransmits_current - this.TCPRetransmits_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }
    getActiveConnectionsRatio(){ 
        const denom = (this.ActiveConnections_max - this.ActiveConnections_min) || 1;
        const normal = (this.ActiveConnections_current - this.ActiveConnections_min) / denom;
        return Math.max(0, Math.min(1, normal));
    }


      // Gán một pod vào node nếu đủ tài nguyên
    assign(pod){ 
        const diskReq = (pod && (pod.disk ?? pod.DiskSpace)) || 0;
        if(this.free_cpu() >= pod.cpu && this.free_ram() >= pod.ram && this.free_disk() >= diskReq) { 
            this.used_cpu += pod.cpu;
            this.used_ram += pod.ram;
            if (diskReq) this.DiskSpace_used += diskReq;
            this.queue.push(pod);
            return true;
        }
        return false;
    }
      // Mô phỏng tiến trình thời gian — cập nhật tiến độ các pod đang chạy

    step(){
        this.queue.forEach((pod) => pod.updateProgress());
            // Loại bỏ các pod hoàn thành
        this.queue = this.queue.filter((pod)=> {
            if(pod.isComplete()){
                this.used_cpu -= pod.cpu;
                this.used_ram -= pod.ram;
                const diskReq = (pod && (pod.disk ?? pod.DiskSpace)) || 0;
                if (diskReq) this.DiskSpace_used -= diskReq;
                return false;
            }
            return true;
        })
    }
      // Có thể thêm metric reward cho PPO
    getLoadRatio() {  
        const cpuRatio = this.used_cpu / this.total_cpu;
        const ramRatio = this.used_ram / this.total_ram;
        const CPUFrequencyRatio = this.getCPUFrequencyRatio();
        const CPUIOWaitRatio = this.getCPUIOWaitRatio();
        const getDiskIOPSReadRatio = this.getDiskIOPSReadRatio();
        const DiskIOPSWriteRatio = this.getDiskIOPSWriteRatio();
        const getDiskLatencyRatio = this.getDiskLatencyRatio();
        const pingExternalRatio = this.getPingExternalRatio();
        const getPingInternalRatio = this.getPingInternalRatio();
        const getNetworkJitterRatio = this.getNetworkJitterRatio();
        const getBandwidthInRatio = this.getBandwidthInRatio();
        const getBandwidthOutRatio = this.getBandwidthOutRatio();
        const getPacketLossRatio = this.getPacketLossRatio();
        const getTCPRetransmitsRatio = this.getTCPRetransmitsRatio();
        const getActiveConnectionsRatio = this.getActiveConnectionsRatio();

        const diskRatio = this.getDiskSpaceRatio();
        const CPUStealRatio = this.getCPUStealRatio();
        const components = [
            cpuRatio,
            ramRatio,
            diskRatio,
            (1 - CPUFrequencyRatio),
            CPUIOWaitRatio,
            getDiskIOPSReadRatio,
            DiskIOPSWriteRatio,
            getDiskLatencyRatio,
            pingExternalRatio,
            getPingInternalRatio,
            CPUStealRatio,
            getNetworkJitterRatio,
            getBandwidthInRatio,
            getBandwidthOutRatio,
            getPacketLossRatio,
            getTCPRetransmitsRatio,
            getActiveConnectionsRatio,
        ];
        const load = components.reduce((a,b)=>a+b,0) / components.length;
        return load;
       }
}


export class Pod { 
    constructor(id, cpu , ram, duration, disk = 0) { 
        this.id =id; 
        this.cpu = cpu
        this.ram = ram; 
        this.disk = disk; // optional disk requirement (GB)
        this.duration = duration;
        this.process = 0;
    }
    updateProgress() { 
        this.process += 1;
    }
    isComplete(){ 
        return this.process >= this.duration
    }
}


export class ClusterSim { 
    constructor(nodes){ 
        this.nodes = nodes; // Mảng các NodeSim
        this.pendingPods = [];
        this.time  = 0;
    }
    addPendingPod(pod){
        this.pendingPods.push(pod);
    }
    assginPodToNode(pod , nodeIndex){ 
        // kept method name for backward-compatibility, calls assign()
        return this.nodes[nodeIndex].assign(pod);
    }

    getState(){
        const nodeState = this.nodes.map((node)=> {
             return [ 
                node.getCPUFrequencyRatio(),
                node.getCPUStealRatio(),
                node.getCPUIOWaitRatio(),
                node.getDiskIOPSReadRatio(),
                node.getDiskIOPSWriteRatio(),
                node.getDiskLatencyRatio(),
                node.getPingExternalRatio(),
                node.getPingInternalRatio(),
                node.getNetworkJitterRatio(),
                node.getBandwidthInRatio(),
                node.getBandwidthOutRatio(),
                node.getPacketLossRatio(),
                node.getTCPRetransmitsRatio(),
                node.getActiveConnectionsRatio(),
                node.used_cpu / node.total_cpu,
                node.used_ram / node.total_ram,
                node.getDiskSpaceRatio(),
               

             ]
        }).flat();
        return nodeState;

    }
    isDone(){ 
        return this.pendingPods.length == 0 && this.nodes.every((node)=> node.queue.length === 0);
    }
    

    snapshot(){
        const nodeState =  this.nodes.map((node)=> { 
            return { 
                id: node.id,
                total_cpu : node.total_cpu,
                total_ram : node.total_ram,
                used_cpu: node.used_cpu,
                used_ram: node.used_ram,
                load_ratio: node.getLoadRatio(),
                queue_length: node.queue.length, 
                 
            }
        }).flat();
        const pending  = this.pendingPods ? this.pendingPods.length : 0;
        return [...nodeState, pending];
    }
    step(){ 
       this.nodes.forEach((node)=> { 
          node.step();
       })
    }
    assign(nodeIndex, pod) {
          const node = this.nodes[nodeIndex];
        const diskReq = (pod && (pod.disk ?? pod.DiskSpace)) || 0;
        if (node.free_cpu() >= pod.cpu && node.free_ram() >= pod.ram && node.free_disk() >= diskReq) {
            return node.assign(pod);
        }
        return false;
     }


}
export default { NodeSim, Pod }