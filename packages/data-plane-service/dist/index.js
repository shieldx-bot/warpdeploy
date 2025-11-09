"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
// import connectDB from './Database/Connect';
const ssh_1 = require("./k8s/jobs/worker/ssh");
const build_image_github_1 = require("./k8s/jobs/build_image_github");
const k8s_client_1 = require("./k8s/k8s-client");
const sqlConfig_1 = require("./Database/sqlConfig");
const setup_1 = require("./k8s/jobs/master/ObservabilityStack /setup");
const app = (0, express_1.default)();
exports.app = app;
const PORT = 8080;
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Initialize DB (non-blocking)
// connectDB();
(0, setup_1.setUpNamespaceObservability)();
app.get('/health', async (req, res) => {
    res.send('Hello from Express Orchestrator Service!');
});
app.post('/send-command', async (req, res) => {
    const { host, username, command } = req.body || {};
    try {
        const targetHost = host || 'ec2-52-195-194-9.ap-northeast-1.compute.amazonaws.com';
        const targetUser = username || 'ubuntu';
        const result = await (0, ssh_1.connectSSH)(targetHost, targetUser);
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to execute command' });
    }
});
app.post('/get_metrix_vps', async (req, res) => {
    const { host, username } = req.body || {};
    try {
        const targetHost = host || 'ec2-13-230-222-83.ap-northeast-1.compute.amazonaws.com';
        const targetUser = username || 'ubuntu';
        const result = await (0, ssh_1.connectSSH)(targetHost, targetUser);
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to get metrix' });
    }
});
app.get('/orchestrator', (_req, res) => {
    res.send('Hello from Express Services Orchestrator!');
});
app.post('/deploy-orchestrator', async (req, res) => {
    try {
        const { owner, repo, cloneUrl } = req.body || {};
        if (!owner || !repo || !cloneUrl) {
            console.log('/deploy-orchestrator : Input Chưa Đầy Đủ');
        }
        const build_image = await (0, build_image_github_1.triggerImageBuild)(owner, repo, cloneUrl);
        if (!build_image) {
            return res.status(500).send('Lỗi khi build image từ GitHub.');
        }
        await (0, k8s_client_1.createPod)(build_image);
        const image_name = `${build_image}`;
        return res.status(200).send(`Đã kích hoạt build và yêu cầu tạo Pod meta-${build_image}. Kiểm tra logs để biết chi tiết.`);
    }
    catch (e) {
        console.error('❌ Route /test-orchestrator error:', e?.message || e);
        return res.status(500).send('Đã xảy ra lỗi trong orchestrator.');
    }
});
app.get('/create-pod', async (req, res) => {
    const tag = req.query.tag || req.query.image || req.query.name;
    if (!tag) {
        return res.status(400).send('Thiếu tham số ?tag=... để đặt image tag.');
    }
    try {
        await (0, k8s_client_1.createPod)(tag);
        return res.send(`Đã yêu cầu tạo Pod meta-${tag}. Kiểm tra logs để biết chi tiết.`);
    }
    catch (e) {
        console.error('❌ Route /create-pod error:', e?.message || e);
        return res.status(500).send('Không thể tạo Pod.');
    }
});
app.post('/getFirstMetrix', async (req, res) => {
    const { hostname, username } = req.body;
    const metrix = await (0, ssh_1.connectSSH)(hostname, username);
    if (metrix.status == 'success') {
        res.status(200).json(metrix);
    }
    else {
        res.status(500).json(metrix);
    }
});
// =======================================================================
const socket_io_1 = require("socket.io");
const express_2 = require("express");
const router = (0, express_2.Router)();
const http_1 = require("http");
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// ✅ Global cron jobs map để cleanup
const cronJobs = new Map();
// const cronJobs = new Map<string, cron.ScheduledTask>();
io.on("connection", async (socket) => {
    let hostname_realtime = '';
    let username_realtime = '';
    if (!socket.connected) {
        console.log("Lỗi không tể kết nối server room");
        return;
    }
    else {
        console.log("connnect socket io success ");
        socket.join(socket.id);
    }
    socket.on('join_room', (roomID) => {
        socket.join(roomID);
        console.log(`User with ID: ${socket.id} joined room: ${roomID}`);
        // Broadcast to the room INCLUDING the sender
        io.to(roomID).emit('message', `User with ID: ${socket.id} has joined the room.`);
    });
    // Receive metrics request from client and emit result back to the specified room
    socket.on('get_metrix', async (data, ack) => {
        try {
            console.log('Get metrix from client: ', data);
            const { hostname, username, roomID } = data || {};
            console.log('Connecting to VPS:', hostname, username);
            const sql = `
      select top1 * from Metrics m where host = @host order by id desc
      `;
            const pool = await sqlConfig_1.pool;
            const stmt = await pool?.request().input('host', data.hostname).query(sql);
            const target = roomID || socket.id;
            io.to(target).emit('send_metrix', stmt);
            ack?.({ ok: true });
        }
        catch (e) {
            console.error('get_metrix error:', e?.message || e);
            ack?.({ ok: false, error: e?.message || 'unknown error' });
            socket.emit('send_metrix_error', e?.message || 'unknown error');
        }
    });
    socket.on('disconnect', () => {
        console.log(`user disconnected with id: ${socket.id}`);
    });
    // Cleanup cron job on disconnect
    const job = cronJobs.get(socket.id);
    if (job) {
        job.stop();
        cronJobs.delete(socket.id);
        console.log(`Cron job for socket id: ${socket.id} has been cleaned up.`);
    }
});
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO is ready on ws://localhost:${PORT}`);
});
