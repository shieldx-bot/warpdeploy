const express = require("express");
const k8s = require("@kubernetes/client-node");
const { triggerImageBuild } = require("./jobs/build_image_github");
const { createPod } = require("./k8s-client");
const app = express();
const PORT = 8080;
const executeRemoteCommand = require("./jobs/vps/ssh").executeRemoteCommand;
app.use(express.json());

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server,  {
  cors: {
    origin: "http://localhost:5173", // Or an array of allowed origins
    // origin: ["https://my-frontend.com", "http://localhost:3000"], 
    methods: ["GET", "POST"], // Allowed HTTP methods
    credentials: true // Allow cookies and HTTP authentication
  }
});
app.use(express.static("public"));



 io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
  socket.on("message", (msg)=> { 
    console.log("Message received: ", msg);
  })

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // Broadcast the message to all connected clients
  });
});
// Route test thường
app.get("/orchestrator", (req, res) => {
  res.send("Hello from Express Services Orchestrator!");
});

// ===== Kubernetes Client Setup =====
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// Namespace mẫu
const namespace = {
  metadata: {
    name: "test-namespace",
  },
};

// Hàm test client
async function testK8sClient() {
  try {
    console.log("Creating namespace...");
    // Gọi API với tham số theo đúng thứ tự: (body[, pretty, dryRun, ...])
    const createRes = await k8sApi.createNamespace(namespace);
    console.log("createRes:", createRes);
    console.log("✅ Created namespace:", createRes.body.metadata.name);

    const readRes = await k8sApi.readNamespace(namespace.metadata.name);
    console.log("📖 Namespace info:", readRes.body.metadata);

    const deleteRes = await k8sApi.deleteNamespace(namespace.metadata.name);
    console.log("🗑️ Deleted namespace:", deleteRes.body.status);
  } catch (err) {
    const msg = err?.body || err?.response?.body || err?.message || String(err);
    console.error("❌ Error with K8s API:", msg);
  }
}



// Route để test Kubernetes API
app.post("/deploy-orchestrator", async (req, res) => {
  try {
    const { owner, repo, cloneUrl } = req.body;
    if (!owner || !repo || !cloneUrl) {
      console.log("/deploy-orchestrator : Input Chưa Đầy Đủ");
    }
    const build_image = await triggerImageBuild(owner, repo, cloneUrl);

    if (!build_image) {
      return res.status(500).send("Lỗi khi build image từ GitHub.");
    }

    await createPod(build_image);
    return res
      .status(200)
      .send(
        `Đã kích hoạt build và yêu cầu tạo Pod meta-${build_image}. Kiểm tra logs để biết chi tiết.`
      );
  } catch (e) {
    console.error("❌ Route /test-orchestrator error:", e?.message || e);
    return res.status(500).send("Đã xảy ra lỗi trong orchestrator.");
  }
});

app.get("/create-pod", async (req, res) => {
  const tag = req.query.tag || req.query.image || req.query.name;
  if (!tag) {
    return res.status(400).send("Thiếu tham số ?tag=... để đặt image tag.");
  }
  try {
    await createPod(tag);
    return res.send(
      `Đã yêu cầu tạo Pod meta-${tag}. Kiểm tra logs để biết chi tiết.`
    );
  } catch (e) {
    console.error("❌ Route /create-pod error:", e?.message || e);
    return res.status(500).send("Không thể tạo Pod.");
  }
});

server.listen(PORT, '0.0.0.0' ,() => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
