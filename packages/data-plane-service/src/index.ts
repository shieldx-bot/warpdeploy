import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './Database/Connect';
import { connectSSH } from './k8s/jobs/vps/ssh';
import { triggerImageBuild } from './k8s/jobs/build_image_github';
import { createPod } from './k8s/k8s-client';
import { pool as poolPromise } from './Database/sqlConfig';

const app = express();
const PORT = 8080;

app.use(express.json());


app.use(express.static('public'));

// Initialize DB (non-blocking)
connectDB();

// Types for request bodies
interface SendCommandBody {
  host?: string;
  username?: string;
  command?: string;
}


app.get('/health', async (req: Request, res: Response)=> {
  res.send('Hello from Express Orchestrator Service!');
})

app.post('/send-command', async (req: Request<unknown, unknown, SendCommandBody>, res: Response) => {
  const { host, username, command } = req.body || {};
  try {
    const targetHost = host || 'ec2-52-195-194-9.ap-northeast-1.compute.amazonaws.com';
    const targetUser = username || 'ubuntu';
    const result = await connectSSH(targetHost, targetUser);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to execute command' });
  }
});

app.post('/get_metrix_vps', async (req: Request<unknown, unknown, { host?: string; username?: string }>, res: Response) => {
  const { host, username } = req.body || {};
  try {
    const targetHost = host || 'ec2-13-230-222-83.ap-northeast-1.compute.amazonaws.com';
    const targetUser = username || 'ubuntu';

    const result = await connectSSH(targetHost, targetUser);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get metrix' });
  }
});





app.get('/orchestrator', (_req: Request, res: Response) => {
  res.send('Hello from Express Services Orchestrator!');
});

app.post('/deploy-orchestrator', async (req: Request<unknown, unknown, { owner?: string; repo?: string; cloneUrl?: string }>, res: Response) => {
  try {
    const { owner, repo, cloneUrl } = req.body || {};
    if (!owner || !repo || !cloneUrl) {
      console.log('/deploy-orchestrator : Input Chưa Đầy Đủ');
    }
    const build_image = await triggerImageBuild(owner!, repo!, cloneUrl!);
    if (!build_image) {
      return res.status(500).send('Lỗi khi build image từ GitHub.');
    }
    await createPod(build_image);
    const image_name = `${build_image}`;

    return res.status(200).send(`Đã kích hoạt build và yêu cầu tạo Pod meta-${build_image}. Kiểm tra logs để biết chi tiết.`);
  } catch (e: any) {
    console.error('❌ Route /test-orchestrator error:', e?.message || e);
    return res.status(500).send('Đã xảy ra lỗi trong orchestrator.');
  }
});

app.get('/create-pod', async (req: Request, res: Response) => {
  const tag = (req.query.tag as string) || (req.query.image as string) || (req.query.name as string);
  if (!tag) {
    return res.status(400).send('Thiếu tham số ?tag=... để đặt image tag.');
  }
  try {
    await createPod(tag);
    return res.send(`Đã yêu cầu tạo Pod meta-${tag}. Kiểm tra logs để biết chi tiết.`);
  } catch (e: any) {
    console.error('❌ Route /create-pod error:', e?.message || e);
    return res.status(500).send('Không thể tạo Pod.');
  }
});


app.post('/getFirstMetrix', async(req, res)=> { 
   const {hostname, username} = req.body;
   const metrix  = await connectSSH(hostname, username)
   if(metrix.status == 'success'){
    res.status(200).json(metrix)
   } else  { 
    res.status(500).json(metrix)
   }
})

 











// =======================================================================
import { Server } from 'socket.io'
import { Express } from 'express'
import { Router } from 'express'
const router = Router()
import { createServer } from 'http'
import cron from 'node-cron';


const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})
// We don't need to keep a manual room registry; Socket.IO manages rooms internally
interface SocketMetrixData {
  hostname: string;
  username: string;
  roomID: string;
}
let realtime = false;
// ✅ Global cron jobs map để cleanup
const cronJobs = new Map<string, cron.ScheduledTask>();



io.on("connection",  async(socket) => {
  let hostname_realtime = ''
  let username_realtime = ''
  if(!socket.connected){
    console.log("Lỗi không tể kết nối server room")
    return
  } else { 
    console.log("connnect socket io success ")
    socket.join(socket.id)
  }
  socket.on('join_room', (roomID: string)=> { 
    socket.join(roomID)
    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);
    // Broadcast to the room INCLUDING the sender
    io.to(roomID).emit('message', `User with ID: ${socket.id} has joined the room.`);

  })

  // Receive metrics request from client and emit result back to the specified room
  socket.on('get_metrix', async (data: { hostname: string; username: string; roomID?: string }, ack?: (resp: unknown) => void) => {
    try {
      console.log('Get metrix from client: ', data)
      const { hostname, username, roomID } = data || ({} as any)
      console.log('Connecting to VPS:', hostname, username)
      const sql = `
      select top1 * from Metrics m where host = @host order by id desc
      `
      const pool = await poolPromise; 
      const stmt = await pool.request().input('host', data.hostname).query(sql)
      
      const target = roomID || socket.id
      io.to(target).emit('send_metrix', stmt);
      ack?.({ ok: true })
    } catch (e: any) {
      console.error('get_metrix error:', e?.message || e)
      ack?.({ ok: false, error: e?.message || 'unknown error' })
      socket.emit('send_metrix_error', e?.message || 'unknown error')
    }
  })

 
  socket.on('disconnect', () => {
    console.log(`user disconnected with id: ${socket.id}`)
  })

  // Cleanup cron job on disconnect
  const job = cronJobs.get(socket.id);
  if (job) {
    job.stop();
    cronJobs.delete(socket.id);
    console.log(`Cron job for socket id: ${socket.id} has been cleaned up.`);
  }
  


})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO is ready on ws://localhost:${PORT}`);
});

export { app, io };