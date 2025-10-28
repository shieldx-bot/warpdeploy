import dotenv from 'dotenv';
import Pool from 'pg-pool';
// Allow standalone usage too; main app also loads envs early
dotenv.config();
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('connect', () => {
    console.log('✅ Database connected');
});
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
});
export default pool;
//# sourceMappingURL=databse.js.map