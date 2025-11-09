import * as  k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);


export const setUpNamespace = async (namespace: any) => {

    try {
        await k8sApi.readNamespace(namespace);
        return 'Namespace already exists';
    } catch (error) {
        try {
            const ns = {
                metadata: {
                    name: namespace
                }
            }
            const res = await k8sApi.createNamespace(ns as any);
            if (!res) {
                return 'Failed to create namespace';
            } else {
                return 'Namespace created successfully';
            }
        } catch (err) {
            return `Error creating namespace: ${err}`;
        }

    }
}




