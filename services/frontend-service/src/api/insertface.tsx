export interface DataAddServer {
    ipAddress: string;
    port: number;
    username: string;
    authMethod: 'password' | 'sshkey';
    password?: string;
    sshKey?: string;
    serverName?: string;
}