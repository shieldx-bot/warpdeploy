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

        } catch (err) {

        }

    }



}

