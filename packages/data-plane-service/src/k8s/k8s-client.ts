// Lazily import the ESM k8s client to avoid require() ESM errors in CommonJS runtime
export type K8sApi = any;
let cachedApi: K8sApi | undefined;

const ensureK8s = async (): Promise<K8sApi> => {
  if (cachedApi) return cachedApi;
  const k8s = await import('@kubernetes/client-node');
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  cachedApi = kc.makeApiClient(k8s.CoreV1Api);
  return cachedApi;
};

export const createPod = async (url_image: string): Promise<void> => {
  const k8sApi = await ensureK8s();
  const image = `shieldxbot/${url_image}:latest`;
  console.log('Creating pod with name:', url_image);

  const pod = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: `meta-${url_image}` },
    spec: {
      imagePullSecrets: [{ name: 'secret-warm' }],
      containers: [
        {
          name: `container-${url_image}`,
          image,
          imagePullPolicy: 'IfNotPresent',
        },
      ],
    },
  } as any;

  try {
    const namespace = 'default';
    let res: any;
    try {
      res = await k8sApi.createNamespacedPod({ namespace, body: pod });
    } catch (errObjectSig: any) {
      try {
        res = await k8sApi.createNamespacedPod(namespace, pod);
      } catch (errPositionalSig: any) {
        const msg1 = errObjectSig?.body || errObjectSig?.response?.body || errObjectSig?.message || String(errObjectSig);
        const msg2 = errPositionalSig?.body || errPositionalSig?.response?.body || errPositionalSig?.message || String(errPositionalSig);
        throw new Error(`createNamespacedPod failed. ObjectSigError: ${msg1}. PositionalSigError: ${msg2}`);
      }
    }
    console.log('✅ Created pod:', res.body?.metadata?.name || `meta-${url_image}`);
  } catch (err: any) {
    const msg = err?.body || err?.response?.body || err?.message || String(err);
    console.error('❌ Error creating pod:', msg);
  }
};
