const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // đọc ~/.kube/config
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function createPod(url_image) {
  const image = `shieldxbot/${url_image}:latest`;
  console.log("Creating pod with name:", url_image);

  const pod = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: { name: `meta-${url_image}` },
    spec: {
      // imagePullSecrets must be an array of LocalObjectReference
      imagePullSecrets: [
        {
          name: "secret-warm",
        },
      ],
      containers: [
        {
          name: `container-${url_image}`,
          image: image,
          imagePullPolicy: "IfNotPresent",
        },
      ],
    },
  };

  

  try {
    const namespace = "default";
    let res;
    try {
      // Ưu tiên chữ ký tham số dạng object (phổ biến ở các phiên bản mới)
      res = await k8sApi.createNamespacedPod({ namespace, body: pod });
    } catch (errObjectSig) {
      // Thử chữ ký tham số dạng vị trí nếu SDK đang dùng kiểu cũ
      try {
        res = await k8sApi.createNamespacedPod(namespace, pod);
      } catch (errPositionalSig) {
        // Nếu cả hai đều lỗi, ném lỗi có ngữ cảnh hơn
        const msg1 = errObjectSig?.body || errObjectSig?.response?.body || errObjectSig?.message || String(errObjectSig);
        const msg2 = errPositionalSig?.body || errPositionalSig?.response?.body || errPositionalSig?.message || String(errPositionalSig);
        throw new Error(`createNamespacedPod failed. ObjectSigError: ${msg1}. PositionalSigError: ${msg2}`);
      }
    }
    console.log("✅ Created pod:", res.body?.metadata?.name || `meta-${url_image}`);
  } catch (err) {
    // Cố gắng hiển thị thông tin lỗi hữu ích nhất
    const msg = err?.body || err?.response?.body || err?.message || String(err);
    console.error("❌ Error creating pod:", msg);
  }
}

module.exports = { createPod };
