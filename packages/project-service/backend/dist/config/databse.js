"use strict";
const dotenv = require('dotenv');
const Pool = require('pg-pool');
dotenv.config();
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('connect', () => {
    console.log("✅ Datbase connected e");
});
pool.on('error', (err) => {
    console.error("❌ Unexpected error on idle client");
});
module.exports = pool;
//# sourceMappingURL=databse.js.map