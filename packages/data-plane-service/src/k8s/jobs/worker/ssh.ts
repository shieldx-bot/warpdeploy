import fs from 'fs';
import path from 'path';
import { NodeSSH } from 'node-ssh';
import { getParmasMem, getParmasDisk, getParmasNet, getParmasLogged, getParmasCpu, getParamsCPUFrequency, getParmasCPUSteal, getParamsDiskIOPSRead, getParamsDiskIOPSWrite, getParamsDiskLatency, getParmasPingExternal, getParmasPingInternal, getParmasNetworkJitter, getParmasBandwidthIn, getParamsPacketLoss } from './getMetrix';
import { pool as poolPromise } from '../../Database/sqlConfig';

// Avoid sharing a single SSH instance across requests to prevent channel contention

export interface SSHResult {
  status: 'success' | 'error';
  ip?: string;
  message?: string;
}

export const connectSSH = async (host: string, username: string, command?: string): Promise<SSHResult> => {
  const ssh = new NodeSSH();
  console.log('Starting SSH connection to', host, 'as', username);
  try {
    const timeOld = Date.now();

    const keyPath = process.env.SSH_KEY_PATH || path.join(__dirname, './key/kubectl.pem');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSH key not found at ${keyPath}. Set SSH_KEY_PATH env var to override.`);
    }
    await ssh.connect({ host, username, privateKey: fs.readFileSync(keyPath, 'utf8') });
    // Enforce strictly sequential SSH command execution via a small queue
    let chain: Promise<void> = Promise.resolve();
    const serialExec = (cmd: string) => {
      const next = chain.then(() => ssh.execCommand(cmd));
      // Keep chain alive even if a command fails so subsequent commands still run
      chain = next.then(() => undefined).catch(() => undefined);
      return next as any;
    };

    // Run commands strictly one-by-one
    const PingInternal = await serialExec(
      `gateway=$(ip route | awk '/default/ {print $3}');\n` +
      `ping -c 3 "$gateway" | awk -v gw="$gateway" '/rtt/ {split($4,a,"/\"); sub(/ ms$/, "", $4); printf "%s %s %s %s %s\\n", gw, a[1], a[2], a[3], a[4]}'`
    );
    const NetworkJitter = await serialExec(`
      target="8.8.8.8"; ping -c 10 $target | awk '/rtt/ {split($4,a,"/"); sub(/ ms$/,"",$4); printf "%s %.3f %.3f %.3f %.3f\n", t, a[1], a[2], a[3], a[4]}' t=$target
      `);
    const TCPRetransmits = await serialExec(`
 a=$(netstat -s | grep -i "segments retransmitted" | awk '{print $1}'); sleep 1; b=$(netstat -s | grep -i "segments retransmitted" | awk '{print $1}'); echo $((b - a))

      `);
    const ActiveConnections = await serialExec(`
      used=$(netstat -an | wc -l); max=65535; echo "$used"`);


    const BandwidthIn = await serialExec(`ifstat 1 1 | awk 'NR==3 {printf "%.2f\n", $1}'`);
    const BandwidthOut = await serialExec(`ifstat 1 1 | awk 'NR==3 {printf "%.2f\n", $2}'`);
    const PacketLoss = await serialExec(`ping -c 30 8.8.8.8 | awk -v host="8.8.8.8" '/packet loss/ {print host, $6}'`);
    // Remaining commands also go through the serial queue for strict order
    const ip = await serialExec('curl ifconfig.me');
    const CPUCores = await serialExec("top -bn1 | grep 'Cpu(s)'");
    const CPUFrequency = await serialExec('cat /proc/cpuinfo | grep MHz');
    const CPUSteal = await serialExec(`top -bn1 | grep "Cpu(s)" | awk -F',' '{print $8}' | awk '{print $1}'`);
    const RAM = await serialExec('free -m');
    const DiskSpace = await serialExec('df -h');
    const DiskIOPSRead = await serialExec(`iostat -x 1 2 | awk '/xvda/ {print $2}'`);
    const DiskIOPSWrite = await serialExec(`iostat -x 1 2 | awk '/xvda/ {print $3}'`);
    const DiskLatency = await serialExec(`iostat -x 1 2 | awk '/xvda/ {print $10}'`);
    const PingExternal = await serialExec(`ping -c 3 8.8.8.8 | tail -1 | awk -F'/' '{print $4, $5, $6, $7}'`);


    try {
      const conn = await poolPromise;
      if (conn) {
        // simple lightweight query to validate connectivity
        await conn.request().query('SELECT 1 as ok');
      } else {
        console.warn('Database pool is not available (connection failed earlier).');
      }
    } catch (e) {
      console.warn('Database request warning:', (e as any)?.message || e);
    }



    // Process metrics (currently just logging)

    const CPUCoresValue = getParmasCpu(CPUCores as any);
    const CPUFrequencyValue = getParamsCPUFrequency(CPUFrequency as any);
    const CPUStealValue = getParmasCPUSteal(CPUSteal as any);
    const RAMValue = getParmasMem(RAM as any);
    const DiskSpaceValue = getParmasDisk(DiskSpace as any);
    const DiskIOPSReadValue = getParamsDiskIOPSRead(DiskIOPSRead as any);
    const DiskIOPSWriteValue = getParamsDiskIOPSWrite(DiskIOPSWrite as any);
    const DiskLatencyValue = getParamsDiskLatency(DiskLatency as any);
    const PingExternalValue = getParmasPingExternal(PingExternal as any);
    const PingInternalValue = getParmasPingInternal(PingInternal as any);
    const NetworkJitterValue = getParmasNetworkJitter(NetworkJitter as any);
    const BandwidthInValue = getParmasBandwidthIn(BandwidthIn as any);
    const BandwidthOutValue = getParmasBandwidthIn(BandwidthOut as any);
    const PacketLossValue = getParamsPacketLoss(PacketLoss as any);
    const TCPRetransmitsValue = TCPRetransmits.stdout.trim();
    const ActiveConnectionsValue = ActiveConnections.stdout.trim();
    // Tạo table payload sqlserver

    const payload = {
      nodeId: '1',
      timestamp: Date.now(),
      ip: ip.stdout,
      COMPUTE_RESOURCES: {
        CPUCores: { //ok
          used: 100 - (CPUCoresValue.idle ?? 0),
          total: 100
        },
        CPUFrequency: {  //ok
          current: CPUFrequencyValue,
          max: 3000,
          min: 800
        },
        CPUSteal: {  //ok
          current: CPUStealValue,
          max: 20,
          min: 0
        },
        CPUIOWait: { //ok
          current: CPUCoresValue.wait,
          max: 30,
          min: 0
        },
        RAM: {  //ok 
          used: RAMValue.used,
          total: RAMValue.total
        },
        DiskSpace: {  //ok
          used: DiskSpaceValue[0].used,
          total: DiskSpaceValue[0].size,

        },
        DiskIOPSRead: { //ok
          current: DiskIOPSReadValue,
          max: 10000,
          min: 0
        },
        DiskIOPSWrite: {  //ok
          current: DiskIOPSWriteValue,
          max: 5000,
          min: 0
        },
        DiskLatency: { //ok
          current: DiskLatencyValue,
          max: 50,
          min: 0
        },
      },
      NETWORK_METRICS: {
        PingExternal: { //ok
          avg: PingExternalValue.avg,
          max: PingExternalValue.max,
          min: PingExternalValue.min
        },
        PingInternal: { //ok
          avg: PingInternalValue.avg,
          max: PingInternalValue.max,
          min: PingInternalValue.min
        },
        NetworkJitter: { //ok
          current: NetworkJitterValue.mdev,
          max: NetworkJitterValue.max,
          min: 0
        },
        BandwidthIn: {  //ok
          current: BandwidthInValue,
          max: 125000,
          min: 0
        },
        BandwidthOut: { //ok
          current: BandwidthOutValue,
          max: 125000,
          min: 0
        },
        PacketLoss: { //ok
          loss: PacketLossValue.loss,
          max: 5,
          min: 0
        },
        TCPRetransmits: { //ok
          current: parseInt(TCPRetransmitsValue),
          max: 100,
          min: 0
        },
        ActiveConnections: {  //ok
          used: parseInt(ActiveConnectionsValue),
          max: 65535,
          min: 0
        }



      }

    }
    interface ResponsePayload {
      status: 'success' | 'error';
      ip?: string;
      payloads?: any;
      timestamp?: number;
    }


    try {
      const sql = `
       inser into Metrics (node, host, timestamp, ip, COMPUTE_RESOURCES, NETWORK_METRICS)
       values ( @nodeId, @host,  @timestamp, @ip, @COMPUTE_RESOURCES, @NETWORK_METRICS)
     `
      const pool = await poolPromise;
      const stmt = await pool?.request()
        .input('nodeId', payload.nodeId)
        .input('timestamp', payload.timestamp)
        .input('host', host)
        .input('ip', payload.ip)
        .input('COMPUTE_RESOURCES', JSON.stringify(payload.COMPUTE_RESOURCES))
        .input('NETWORK_METRICS', JSON.stringify(payload.NETWORK_METRICS))
        .query(sql);
      console.log('Metrics inserted successfully for node', payload.nodeId);
    } catch (error) {
      const response: ResponsePayload = {
        status: 'error',
        ip: ip.stdout,
        payloads: payload,
        timestamp: Date.now() - timeOld
      }
      return response
    }




    const response: ResponsePayload = {
      status: 'success',
      ip: ip.stdout,
      payloads: payload,
      timestamp: Date.now() - timeOld
    }

    return response;
  } catch (e: any) {
    return { status: 'error', message: e?.message || 'SSH connection failed' };
  } finally {
    try { await ssh.dispose(); } catch { }
  }
};





