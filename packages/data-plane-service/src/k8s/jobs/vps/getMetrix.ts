export interface CmdResult { stdout: string }

export interface CmdResult { stdout: string }

export interface CpuMetrics {
  // Friendly names
  user?: number; // us
  sys?: number;  // sy
  nice?: number; // ni
  idle?: number; // id
  wait?: number; // wa
  hi?: number;   // hi
  si?: number;   // si
  st?: number;   // st
  // Keep raw abbreviations too for compatibility
  [key: string]: number | undefined;
}

export const getParmasCpu = (cpu: CmdResult): CpuMetrics => {
  const cpulines = cpu.stdout;
  const cpu_str = cpulines.replace('%Cpu(s):', '').trim();
  const result: CpuMetrics = {};
  const parts = cpu_str
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const keyMap: Record<string, keyof CpuMetrics> = {
    us: 'user',
    sy: 'sys',
    ni: 'nice',
    id: 'idle',
    wa: 'wait',
    hi: 'hi',
    si: 'si',
    st: 'st',
  };

  for (const item of parts) {
    const math = item.match(/([\d.]+)%?\s*([a-zA-Z]+)/);
    if (math && math.length === 3) {
      const value = parseFloat(math[1]);
      const abbr = math[2];
      // Set both abbreviation and friendly name when applicable
      (result as any)[abbr] = value;
      const friendly = keyMap[abbr];
      if (friendly) {
        result[friendly] = value;
      }
    }
  }

  console.log(result);
  return result;
};


export const getParamsCPUFrequency = (cpuFreq: CmdResult) => { 
  const CPUFrequencDeleteTitle = cpuFreq.stdout.replace("cpu","").trim();

  const cpu_lines = CPUFrequencDeleteTitle.replace("MHz","").trim();
  const value = cpu_lines.replace(':','').trim()
 

  return parseFloat(value);
}
export const getParmasCPUSteal = (cpuSteal: CmdResult) => {
  const cpu_steal_lines = cpuSteal.stdout;
  return parseFloat(cpu_steal_lines);
}
export const getParmasMem = (mem: CmdResult) => {
 
  const memlines = mem.stdout.split('\n');
  const mem_str = memlines[1].replace('Mem:', '').trim();
  const mem_data: Record<string, number> = {};
  const parts = mem_str
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);
  const keys = ['total', 'used', 'free', 'shared', 'buff_cache', 'available'];
  parts.forEach((part, index) => {
    const value = parseInt(part);
    const key = keys[index];
    mem_data[key] = value;
  });
  
  return mem_data;
};

export const getParamsDiskIOPSRead = (DiskIOPSRead: CmdResult) => { 
  const disk_iops_lines = DiskIOPSRead.stdout;
  return parseFloat(disk_iops_lines);
}
export const getParamsDiskIOPSWrite = (DiskIOPSWrite: CmdResult) => {
  const disk_iops_lines = DiskIOPSWrite.stdout;
  return parseFloat(disk_iops_lines);
}
export const getParamsDiskLatency = (DiskLatency: CmdResult) => { 
  const disk_latency_lines = DiskLatency.stdout;
  return parseFloat(disk_latency_lines);
}
export const getParmasPingExternal	 = (net: CmdResult) => {
  const netlines = net.stdout;
  const netDeleteTitle = netlines.replace("mdev =","").replace("ms","").trim();
  const [min, avg, max, mdev] = netDeleteTitle.split(' ').map(parseFloat);
  return { min, avg, max, mdev };
}

export const getParmasPingInternal = (PingInternal : CmdResult) => {
  const netlines = PingInternal.stdout;
   const [gateway, min, avg, max, mdev] = netlines.split(' ').map(parseFloat);
  return {gateway,  min, avg, max, mdev };
}

export const getParmasNetworkJitter = (jitter: CmdResult) => {
  const netlines = jitter.stdout;
  const [ip , min, avg, max, mdev] = netlines.split(' ').map(parseFloat);
  return { ip, min, avg, max, mdev };

}
export const getParmasBandwidthIn = (bandwidthIn: CmdResult) => {
  const netlines = bandwidthIn.stdout;
  return parseFloat(netlines);
}
export const getParamsPacketLoss = (packetLoss: CmdResult) => {
  const netlines = packetLoss.stdout;
  const newnetlines = netlines.replace('%', '');
  const [ip , loss] = newnetlines.split(' ').map((part) => part.trim());
  return { 
    ip , loss: parseFloat(loss)
  }
}

export const getParmasDisk = (disk: CmdResult) => {
  const disklines = disk.stdout.split('\n');
  const disk_data: Array<any> = [];
  disklines.slice(1).forEach((line) => {
    const parts = line.split(' ').filter((part) => part !== '');
    if (parts.length === 6) {
      if (parts[0].includes('G')) {
        parts[0] = (parseFloat(parts[0].replace('G', '')) * 1024).toString();
      } else {
        parts[0] = parts[0].replace('M', '');
      }
      if (parts[1].includes('G')) {
        parts[1] = (parseFloat(parts[1].replace('G', '')) * 1024).toString();
      } else {
        parts[1] = parts[1].replace('M', '');
      }
      if (parts[2].includes('G')) {
        parts[2] = (parseFloat(parts[2].replace('G', '')) * 1024).toString();
      } else {
        if (parts[2].includes('K')) {
          parts[2] = (parseFloat(parts[2].replace('K', '')) / 1024).toString();
        }
        parts[2] = parts[2].replace('M', '');
      }
      if (parts[3].includes('G')) {
        parts[3] = (parseFloat(parts[3].replace('G', '')) * 1024).toString();
      } else {
        parts[3] = parts[3].replace('M', '');
      }
      if (parts[4].includes('%')) {
        parts[4] = parts[4].replace('%', '');
      }

      const filesystem = parts[0];
      const size = parseFloat(parts[1]);
      const used = parseFloat(parts[2]);
      const avail = parseFloat(parts[3]);
      const usePercent = parseFloat(parts[4]);
      const mountpoint = parts[5];

      disk_data.push({
        getParmasDisk: filesystem,
        size: size,
        used: used,
        avail: avail,
        useParcent: usePercent,
        mountpoint: mountpoint,
      });
    }
  });
 
  return disk_data;
};

export const getParmasNet = (net: CmdResult) => {
  const netlines = net.stdout;
  const netlines_array = netlines.split(' ').filter((part) => part !== '');
  const data = [
    {
      receive_KBps: parseFloat(netlines_array[0]),
      transmit_KBps: parseFloat(netlines_array[1]),
    },
  ];
   return data;
};

export const getParmasLogged = (logged: CmdResult) => {
  const loggedlines = logged.stdout;
  const logged_array = loggedlines.split('\n').filter((part) => part !== '');
  const data: Array<any> = [];
  logged_array.forEach((line) => {
    const parts = line.split(' ').filter((part) => part !== '');
    if (parts.length >= 6) {
      const username = parts[0];
      const terminal = parts[1];
      const ip = parts[2];
      const date = parts[3] + ' ' + parts[4] + ' ' + parts[5];
      const action = parts.slice(6).join(' ');
      data.push({ username, terminal, ip, date, action });
    }
  });
   return data;
};
