import * as  k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

/// Query Kubernetes for namespace existence

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

export const deleteNamespace = async (namespace: any) => {
    try {
        await k8sApi.deleteNamespace(namespace);
        return 'Namespace deleted successfully';
    } catch (error) {
        return `Error deleting namespace: ${error}`;
    }
}

export const listNamespaces = async () => {
    try {
        const res = await k8sApi.listNamespace();
        return res.items.map(ns => ns.metadata?.name);
    } catch (error) {
        return `Error listing namespaces: ${error}`;
    }
}

