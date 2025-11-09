/**
* Example usage of MicroK8s setup functions
* 
* Test các function setup MicroK8s qua SSH
*/

import {
    setupMicroK8sRemote,
    checkMicroK8sStatus,
    getGrafanaInfo
} from '../src/k8s/jobs/master/ObservabilityStack /setup-microk8s';

// Configuration - thay đổi theo môi trường của bạn
const config = {
    host: '192.168.1.100',  // IP hoặc hostname của target server
    username: 'ubuntu',
    // Chọn 1 trong 2 phương thức auth:
    password: 'your-password',
    // privateKeyPath: '/home/user/.ssh/id_rsa',
    port: 22
};

async function main() {
    console.log('🚀 Starting MicroK8s setup test...\n');

    try {
        // 1. Setup MicroK8s
        console.log('📦 Step 1: Installing MicroK8s with Observability Stack...');
        const setupResult = await setupMicroK8sRemote(config);

        if (setupResult.status === 'success') {
            console.log('✅ Setup completed successfully!\n');
            console.log('Output:', setupResult.output);
        } else {
            console.error('❌ Setup failed:', setupResult.message);
            console.error('Error:', setupResult.error);
            process.exit(1);
        }

        // Wait a bit for services to start
        console.log('\n⏳ Waiting 30 seconds for services to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // 2. Check status
        console.log('\n📊 Step 2: Checking MicroK8s status...');
        const statusResult = await checkMicroK8sStatus(config);

        if (statusResult.status === 'success') {
            console.log('✅ MicroK8s is running!\n');
            console.log('Status:', statusResult.output);
        } else {
            console.warn('⚠️  Status check failed:', statusResult.message);
        }

        // 3. Get Grafana info
        console.log('\n📈 Step 3: Getting Grafana access info...');
        const grafanaResult = await getGrafanaInfo(config);

        if (grafanaResult.status === 'success') {
            console.log('✅ Grafana info retrieved!\n');
            console.log(grafanaResult.output);
            console.log('\n💡 To access Grafana:');
            console.log('   1. SSH to the server');
            console.log('   2. Run: microk8s kubectl -n observability port-forward svc/grafana 3000:80');
            console.log('   3. Open: http://localhost:3000');
            console.log('   4. Login with credentials above\n');
        } else {
            console.warn('⚠️  Could not get Grafana info:', grafanaResult.message);
        }

        console.log('✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { main };
