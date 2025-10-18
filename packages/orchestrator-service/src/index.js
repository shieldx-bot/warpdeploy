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
  const build_image = await triggerImageBuild('https://github.com/shieldx-bot/backend_exemple.git');
  if(build_image){
    
    await createPod(build_image);
  } else { 
    res.send("Lỗi khi build image từ GitHub.");
  }
  res.send("Testing Kubernetes client... Check console for details!");
});

app.get('/create-pod', async(req,res)=> {
 
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
