import * as k8s from '@kubernetes/client-node';


const kc = new k8s.KubeConfig(); 
kc.loadFfromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);


var namespace  =  { 
    metadata : { 
        name: 'test',
    },
}

export function testK8sClient() {
k8sApi.createNamespace({body: namespace}).then(
    (response) => { 
        console.log('Created namespace');
        console.log(response);
        k8sApi.readNamespace(namespace.metadata.name).then((response)=>  { 
            console.log(response); 
            k8sApi.deleteNamespace(namespace.metadata.name)
        })
    },
    (err) => { 
     console.log('Error create namespace: ', err);
    }
)
}

