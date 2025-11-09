/**
* MicroK8s Setup via SSH
* 
* Module to remotely install and configure MicroK8s with Observability Stack
* on target hosts via SSH connection
*/

import { Client, ConnectConfig } from 'ssh2';
import fs from 'fs';
import path from 'path';

interface SSHConnectionConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: Buffer | string;
    privateKeyPath?: string;
}

interface SetupResult {
    status: 'success' | 'error';
    message: string;
    output?: string;
    error?: string;
}

/**
 * Execute MicroK8s setup script on remote host via SSH
 */
export async function setupMicroK8sRemote(
    config: SSHConnectionConfig
): Promise<SetupResult> {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        // Read the setup script
        const scriptPath = path.join(__dirname, '../../scripts/setup-microk8s-observability.sh');
        let setupScript: string;

        try {
            setupScript = fs.readFileSync(scriptPath, 'utf8');
        } catch (err) {
            return resolve({
                status: 'error',
                message: 'Failed to read setup script',
                error: err instanceof Error ? err.message : String(err)
            });
        }

        let output = '';
        let errorOutput = '';

        const sshConfig: ConnectConfig = {
            host: config.host,
            port: config.port || 22,
            username: config.username,
        };

        // Handle authentication
        if (config.privateKey) {
            sshConfig.privateKey = config.privateKey;
        } else if (config.privateKeyPath) {
            try {
                sshConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (err) {
                return resolve({
                    status: 'error',
                    message: 'Failed to read private key',
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        } else if (config.password) {
            sshConfig.password = config.password;
        } else {
            return resolve({
                status: 'error',
                message: 'No authentication method provided (password or privateKey required)'
            });
        }

        conn.on('ready', () => {
            console.log(`✓ SSH connection established to ${config.host}`);

            // Execute script via stdin
            conn.exec('bash -s', (err, stream) => {
                if (err) {
                    conn.end();
                    return resolve({
                        status: 'error',
                        message: 'Failed to execute remote command',
                        error: err.message
                    });
                }

                // Send script content to stdin
                stream.write(setupScript);
                stream.end();

                stream.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    output += chunk;
                    console.log(chunk);
                });

                stream.stderr.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    errorOutput += chunk;
                    console.error(chunk);
                });

                stream.on('close', (code: number) => {
                    conn.end();

                    if (code === 0) {
                        resolve({
                            status: 'success',
                            message: 'MicroK8s Observability Stack setup completed successfully',
                            output: output
                        });
                    } else {
                        resolve({
                            status: 'error',
                            message: `Setup script exited with code ${code}`,
                            output: output,
                            error: errorOutput
                        });
                    }
                });
            });
        });

        conn.on('error', (err) => {
            resolve({
                status: 'error',
                message: 'SSH connection error',
                error: err.message
            });
        });

        conn.on('timeout', () => {
            conn.end();
            resolve({
                status: 'error',
                message: 'SSH connection timeout'
            });
        });

        // Connect with timeout
        conn.connect({
            ...sshConfig,
            readyTimeout: 30000
        });
    });
}

/**
 * Check MicroK8s status on remote host
 */
export async function checkMicroK8sStatus(
    config: SSHConnectionConfig
): Promise<SetupResult> {
    return new Promise((resolve) => {
        const conn = new Client();
        let output = '';

        const sshConfig: ConnectConfig = {
            host: config.host,
            port: config.port || 22,
            username: config.username,
        };

        if (config.privateKey) {
            sshConfig.privateKey = config.privateKey;
        } else if (config.privateKeyPath) {
            try {
                sshConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (err) {
                return resolve({
                    status: 'error',
                    message: 'Failed to read private key',
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        } else if (config.password) {
            sshConfig.password = config.password;
        }

        conn.on('ready', () => {
            conn.exec('microk8s kubectl get nodes && microk8s kubectl get pods -n observability', (err, stream) => {
                if (err) {
                    conn.end();
                    return resolve({
                        status: 'error',
                        message: 'Failed to execute status command',
                        error: err.message
                    });
                }

                stream.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                stream.on('close', (code: number) => {
                    conn.end();

                    if (code === 0) {
                        resolve({
                            status: 'success',
                            message: 'MicroK8s is running',
                            output: output
                        });
                    } else {
                        resolve({
                            status: 'error',
                            message: 'MicroK8s is not properly configured',
                            output: output
                        });
                    }
                });
            });
        });

        conn.on('error', (err) => {
            resolve({
                status: 'error',
                message: 'SSH connection error',
                error: err.message
            });
        });

        conn.connect(sshConfig);
    });
}

/**
 * Get Grafana access information from remote MicroK8s
 */
export async function getGrafanaInfo(
    config: SSHConnectionConfig
): Promise<SetupResult> {
    return new Promise((resolve) => {
        const conn = new Client();
        let output = '';

        const sshConfig: ConnectConfig = {
            host: config.host,
            port: config.port || 22,
            username: config.username,
        };

        if (config.privateKey) {
            sshConfig.privateKey = config.privateKey;
        } else if (config.privateKeyPath) {
            try {
                sshConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (err) {
                return resolve({
                    status: 'error',
                    message: 'Failed to read private key'
                });
            }
        } else if (config.password) {
            sshConfig.password = config.password;
        }

        conn.on('ready', () => {
            const cmd = `
        echo "=== Grafana Service ===" && \
        microk8s kubectl get svc -n observability -l app.kubernetes.io/name=grafana && \
        echo -e "\n=== Grafana Admin Password ===" && \
        microk8s kubectl get secret -n observability grafana -o jsonpath='{.data.admin-password}' | base64 -d && echo
      `;

            conn.exec(cmd, (err, stream) => {
                if (err) {
                    conn.end();
                    return resolve({
                        status: 'error',
                        message: 'Failed to get Grafana info',
                        error: err.message
                    });
                }

                stream.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                stream.on('close', () => {
                    conn.end();
                    resolve({
                        status: 'success',
                        message: 'Grafana information retrieved',
                        output: output
                    });
                });
            });
        });

        conn.on('error', (err) => {
            resolve({
                status: 'error',
                message: 'SSH connection error',
                error: err.message
            });
        });

        conn.connect(sshConfig);
    });
}
