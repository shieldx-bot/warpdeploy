import * as sql from 'mssql';
 
export const  sqlConfig: sql.config = { 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME,
    options: { 
        encrypt: true,
        trustServerCertificate: true,
    },
    port: Number(process.env.DB_PORT) || 1433,
    connectionTimeout: process.env.DB_CONNECTION_TIMEOUT ? Number(process.env.DB_CONNECTION_TIMEOUT) : 15000,
    requestTimeout: process.env.DB_REQUEST_TIMEOUT ? Number(process.env.DB_REQUEST_TIMEOUT) : 15000,
    pool: { 
        max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
        min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : 0,        
    }
}