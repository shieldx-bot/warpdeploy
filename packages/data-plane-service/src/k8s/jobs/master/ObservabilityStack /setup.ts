import { setUpNamespace } from "../../../query/namespace";

export const setUpNamespaceObservability = async () => {
    const namespace = 'observability';
    try {
        const createNsResult = await setUpNamespace(namespace);
        if (createNsResult === 'Namespace created successfully' || createNsResult === 'Namespace already exists') {
            console.log(`Step 1: Namespace '${namespace}' is ready.`);
        }
    } catch (error) {
        console.error('Error setting up observability namespace:', error);
    }


}