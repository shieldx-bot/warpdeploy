import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './Database/Connect';
import { connectSSH } from './jobs/vps/ssh';
import { triggerImageBuild } from './jobs/build_image_github';
import { createPod } from './k8s-client';
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

const RemoveDeploymentIfExists  = async(owner: string, repo: string, email: string) => {
 try { 
   const pool = await poolPromise;
  const sql = `
  delete from Deployments where repo_owner = @owner and repo_name = @repo and email_user = @email
  `
  await pool.request()
    .input('owner', owner)
    .input('repo', repo)
    .input('email', email)
    .query(sql);

  return true; 
    
 } catch(error){ 
  return false ;
 }
}

let StatusGithub = true;
let TimeStopRequest: number | null = null;
// Probabilistic gating without HALF_OPEN:
// - When down, block for 30s; after that, allow a fraction of requests to probe.
const BLOCK_MS = 30_000;
const RETRY_PROB = 0.3; // 30%

const isBlocked = (): boolean => {
  if (StatusGithub) return false;
  if (TimeStopRequest == null) return false;
  const elapsed = Date.now() - TimeStopRequest;
  return elapsed < BLOCK_MS;
};

const canProbationTry = (): boolean => {
  if (StatusGithub) return true;
  const elapsed = Date.now() - (TimeStopRequest ?? 0);
  if (elapsed < BLOCK_MS) return false;
  return Math.random() < RETRY_PROB;
};

const markGithubFalse  =  () => { 
  StatusGithub = false;
  TimeStopRequest = Date.now();
}
const markGithubTrue = () => { 
  StatusGithub = true;
  TimeStopRequest = null;
}

// Utility: timeout wrapper for outbound calls
const withTimeout = <T>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
 

app.post('/deploy-orchestrator', async (req: Request<unknown, unknown, { owner?: string; repo?: string; cloneUrl?: string, email: string , image: string }>, res: Response) => {
     const pool = await poolPromise;
     const { owner, repo, cloneUrl , email , image} = req.body || {};
     // Gate according to probabilistic breaker
     if (!StatusGithub) {
      if (isBlocked()) {
        return res.status(503).json({ status: 'error', message: 'GitHub API is currently unavailable. Please try again 30 seconds later.' })
      }
      if (!canProbationTry()) {
        console.log('⏳ Probation gating: denied due to randomization.');
        return res.status(503).json({ status: 'error', message: 'GitHub API is currently unavailable. Please try again later.' })
      }
      // allowed to try; DO NOT mark true yet
     }

  try {
    if (!owner || !repo || !cloneUrl || !email || !image) {
      console.log('/deploy-orchestrator : Input Chưa Đầy Đủ');
      return res.status(400).send('Thiếu thông tin cần thiết: owner, repo, cloneUrl, email hoặc image.');
    }
    // kiểm tra repo đã có trong danh sách  deployment hay chưa nếu chưa thì mới cho tiếp tục còn không thì thôi
    const sql  = `
    select count(*) as count from Deployments where repo_owner = @owner and repo_name = @repo and email_user = @email and status in ('building', 'deploying')
    `
    const stmt = await pool.request()
      .input('owner', owner)
      .input('repo', repo)
      .input('email', email)
      .query(sql);

    const count  = stmt.recordset[0]?.count || 0;
    if(count > 0){ 
      return res.status(409).send('Repository đã tồn tại trong danh sách deployment.');
    } else { 
      const sql = `
      insert into Deployments (repo_owner, repo_name, clone_url, email_user, image_name, status) values (@owner, @repo, @cloneUrl, @email, @image, 'building')
      `
      await pool.request()
        .input('owner', owner)
        .input('repo', repo)
        .input('cloneUrl', cloneUrl)
        .input('email', email)
        .input('image', image)
        .query(sql);
    
    }
    
    let build_image: string | undefined;
    try {
      build_image = await withTimeout(triggerImageBuild(owner!, repo!, cloneUrl!), 10_000);
    } catch (e) {
      markGithubFalse();
      const removal = await RemoveDeploymentIfExists(owner!, repo!, email!);
      if (!removal) console.error('❌ Failed to remove deployment record after build image timeout/error.');
      return res.status(502).send('Timeout hoặc lỗi khi kết nối GitHub. Vui lòng thử lại sau.');
    }
    if(build_image === 'Connect Github API failed'){
       markGithubFalse();
       const removal = await RemoveDeploymentIfExists(owner!, repo!, email!);
       if (!removal) console.error('❌ Failed to remove deployment record after GitHub API failure.');
       return res.status(502).send('Lỗi khi kết nối GitHub API. Vui lòng thử lại sau 30 giây.');
    }
    if (!build_image) {
      const removalSuccess = await RemoveDeploymentIfExists(owner, repo, email);
      if (!removalSuccess) {
        console.error('❌ Failed to remove deployment record after build image failure.');
      } 

      return res.status(500).send('Lỗi khi build image từ GitHub.');
    }
    // success → mark healthy again
    markGithubTrue();
    await createPod(build_image);
    const image_name = `${build_image}`;
    console.log(`✅ Created Pod for image: ${image_name}`);
    const removalSuccess = await RemoveDeploymentIfExists(owner, repo, email);
    if (!removalSuccess) {
      console.error('❌ Failed to remove deployment record after pod creation.');
    }

    return res.status(200).send(`Đã kích hoạt build và yêu cầu tạo Pod meta-${build_image}. Kiểm tra logs để biết chi tiết.`);
  } catch (e: any) {
    const removalSuccess = await RemoveDeploymentIfExists(owner, repo, email);
    if (!removalSuccess) {
      console.error('❌ Failed to remove deployment record after pod creation.');
    }
    console.error('❌ Route /deploy-orchestrator error:', e?.message || e);
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

app.get('/getToken', async(req,res)=>{ 
  const { generateAccessTokenForORchestratorService } = await import('./security/token');
  const token = generateAccessTokenForORchestratorService();
  res.status(200).json({ token });
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
  SELECT TOP 1 * FROM Metrics m WHERE host = @host ORDER BY id DESC
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