 
  const getParmasCpu = (cpu) =>  {
  const cpulines = cpu.stdout;
  const cpu_str = cpulines.replace("%Cpu(s):", "").trim();
  cpu_data = {};
  const parts = cpu_str
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const item of parts) {
    const math = item.match(/([\d.]+)\s*([a-zA-Z]+)/);
    if (math && math.length === 3) {
      const key = math[2];
      const value = parseFloat(math[1]);
      cpu_data[key] = value;
    }
  }
  console.log(cpu_data);
};

 const getParmasMem = (mem) => {
  console.log(mem);
  const memlines = mem.stdout.split("\n");

  const mem_str = memlines[1].replace("Mem:", "").trim();
  mem_data = {};
  const parts = mem_str
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const keys = ["total", "used", "free", "shared", "buff_cache", "available"];
  parts.forEach((part, index) => {
    const value = parseInt(part);
    const key = keys[index];
    mem_data[key] = value;
  });
  console.log(mem_data);
};


 const getParmasDisk = (disk) => {
  const disklines = disk.stdout.split("\n");
  const disk_data = [];
  disklines.slice(1).forEach((line) => {
    const parts = line.split(" ").filter((part) => part !== "");
    if (parts.length === 6) {
      if(parts[0].includes("G")) { 
        parts[0] = (parseFloat(parts[0].replace("G", "")) * 1024).toString() ;
      } else { 
        parts[0] = parts[0].replace("M", "") ;
      }
      if(parts[1].includes("G")) { 
        parts[1] = (parseFloat(parts[1].replace("G", "")) * 1024).toString() ;
      } else  { 
        parts[1] = parts[1].replace("M", "") ;
      }
      if(parts[2].includes("G")) { 
        parts[2] = (parseFloat(parts[2].replace("G", "")) * 1024).toString() ;
      } else { 
        if(parts[2].includes("K") ){ 
          parts[2] = (parseFloat(parts[2].replace("K", "")) / 1024).toString() ;
        }
        parts[2] = parts[2].replace("M", "") ;
      }
      if(parts[3].includes("G")) { 
        parts[3] = (parseFloat(parts[3].replace("G", "")) * 1024).toString() ;
      } else  { 
        parts[3] = parts[3].replace("M", "") ;
      }
      if(parts[4].includes("%")){ 
        parts[4] = parts[4].replace("%", "") ;
      }
  
      const filesystem = parts[0];
      const size = parseFloat(parts[1]) ;
      const used = parseFloat(parts[2]) ;
      const avail = parseFloat(parts[3]) ;
      const usePercent = parseFloat(parts[4]) ;
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
    console.log(disk_data);
};


 const getParmasNet = (net) =>  {
    const netlines = net.stdout;
    netlines_array = netlines.split(" ").filter((part) => part !== "");

    data = [];
    data.push({
        receive_KBps: parseFloat(netlines_array[0]),
        transmit_KBps: parseFloat(netlines_array[1]),
    })
    console.log(data);
}

 const  getParmasLogged = (logged) =>  {
  const loggedlines = logged.stdout;
  const logged_array = loggedlines.split("\n").filter((part) => part !== "");
  const data = [];
   logged_array.forEach((line) => { 
    const parts = line.split(" ").filter((part) => part !== "");
    if (parts.length >= 6)  { 
      const username = parts[0];
      const terminal = parts[1];
      const ip = parts[2];
      const date = parts[3] + " " + parts[4] + " " + parts[5];
      const action = parts.slice(6).join(" ");
      data.push({ 
        username: username,
        terminal: terminal,
        ip: ip,
        date: date,
        action: action,
      })
    }
  })
  console.log(data)

}


 


 module.exports = { getParmasCpu, getParmasMem, getParmasDisk, getParmasNet, getParmasLogged };