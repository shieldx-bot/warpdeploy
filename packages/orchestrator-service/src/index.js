const express = require("express");
const k8s = require("@kubernetes/client-node"); 
const { triggerImageBuild } = require("./jobs/build_image_github");
const { createPod } = require ("./k8s-client");
const app = express();
const PORT = 3002;

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
    console.log("createRes:" ,createRes )
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
app.get("/test-orchestrator", async (req, res) => {
  try {
    const build_image = await triggerImageBuild('https://github.com/shieldx-bot/backend_exemple.git');

    if (!build_image) {
      return res.status(500).send("Lỗi khi build image từ GitHub.");
    }

    await createPod(build_image);
    return res.send(`Đã kích hoạt build và yêu cầu tạo Pod meta-${build_image}. Kiểm tra logs để biết chi tiết.`);
  } catch (e) {
    console.error("❌ Route /test-orchestrator error:", e?.message || e);
    return res.status(500).send("Đã xảy ra lỗi trong orchestrator.");
  }
});

app.get('/create-pod', async (req, res) => {
  const tag = req.query.tag || req.query.image || req.query.name;
  if (!tag) {
    return res.status(400).send("Thiếu tham số ?tag=... để đặt image tag.");
  }
  try {
    await createPod(tag);
    return res.send(`Đã yêu cầu tạo Pod meta-${tag}. Kiểm tra logs để biết chi tiết.`);
  } catch (e) {
    console.error("❌ Route /create-pod error:", e?.message || e);
    return res.status(500).send("Không thể tạo Pod.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
