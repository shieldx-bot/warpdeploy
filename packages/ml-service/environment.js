class NodeSim { 
    constructor(id, total_cpu, total_ram) { 
        this.id = id;
        this.total_cpu = total_cpu;
        this.total_ram = total_ram;
        this.used_cpu = 0;
        this.used_ram = 0;
        this.queue = [];
    }

    free_cpu() {
        return this.total_cpu - this.used_cpu;
    }
    free_ram(){ 
        return this.toal_ram - this.used_ram;
    }
      // Gán một pod vào node nếu đủ tài nguyên
    assgin(pod){ 
        if(this.free_cpu() >= pod.cpu_request && this.free_ram()>= pod.ram_request) { 
            this.used_cpu += pod.cpu_request;
            this.used_ram += pod.ram_request;
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
                this.used_cpu -= pod.cpu_request;
                this.used_ram -= pod.ram_request;
                return false;
            }
            return true;
        })
    }
      // Có thể thêm metric reward cho PPO
    getLoadRatio() {  
        return (this.used_cpu / this.total_cpu + this.used_ram / this.total_ram) / 2;
    }
}


class Pod { 
    constructor(id, cpu , ram, duration) { 
        this.id =id; 
        this.cpu = cpu
        this.ram = ram; 
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


class ClusterSim { 
    constructor(nodes){ 
        this.nodes = nodes; // Mảng các NodeSim
        this.pendingPods = [];
        this.time  = 0;
    }
    addPendingPod(pod){
        this.pendingPods.push(pod);
    }
    assginPodToNode(pod , nodeIndex){ 
        return this.nodes[nodeIndex].assgin(pod);
    }

    getState(){
        const nodeState = this.nodes.map((node)=> {
             return [ 
                node.total_cpu,
                node.total_ram,
                node.free_cpu(),
                node.free_ram(),
                node.getLoadRatio(),
                node.queue.length

             ]
        })
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
         if(NodeSim.free_cpu() >= pod.cpu &&  NodeSim.free_ram() >= pod.ram) { 
            return this.nodes[nodeIndex].assgin(pod);
         } else { 

            return false;
         }
     }


}



module.exports = { 
    NodeSim, 
    Pod
}