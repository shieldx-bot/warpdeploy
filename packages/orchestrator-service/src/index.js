const express = require("express");
const k8s = require("@kubernetes/client-node"); 

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
    const createRes = await k8sApi.createNamespace({ body: namespace });
    console.log("✅ Created namespace:", createRes.body.metadata.name);

    const readRes = await k8sApi.readNamespace(namespace.metadata.name);
    console.log("📖 Namespace info:", readRes.body.metadata);

    const deleteRes = await k8sApi.deleteNamespace(namespace.metadata.name);
    console.log("🗑️ Deleted namespace:", deleteRes.body.status);
  } catch (err) {
    console.error("❌ Error with K8s API:", err.body || err.message);
  }
}

// Route để test Kubernetes API
app.get("/test-orchestrator", async (req, res) => {
  testK8sClient();
  res.send("Testing Kubernetes client... Check console for details!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
