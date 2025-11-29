import sql from 'mssql';

const sqlConfig: sql.config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'MyStrongP@ssw0rd!',
    server: process.env.DB_SERVER || 'localhost',
    database: 'warpdeploy',
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
    },
};


export default async function createPool() {
    try {
        const pool = await sql.connect(sqlConfig);
        if (!pool.connected) {
            throw new Error('Failed to connect to the database');
        } else {
            console.log('Database connection pool created successfully');
        }
    } catch (error) {
        console.error('Error creating database connection pool:', error);
    }
    return sql.connect(sqlConfig);
}
