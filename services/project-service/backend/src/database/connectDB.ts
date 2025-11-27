import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqlConfig } from './config.js';

export const connectDB = async () => {
    try {
        const pool = await sql.connect(sqlConfig);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const schemaFilePath = path.join(__dirname, 'schema.sql');
        const sqlSchema = fs.readFileSync(schemaFilePath, 'utf8');
        pool.query(sqlSchema, (err: any) => {
            if (err) {
                console.error('Error executing SQL schema:', err);
            }
            console.log('SQL schema executed successfully.');
        });
        if (pool.connected) {
            console.log('Database Connected');
        } else {
            console.log('Database Not Connected');
        }
        return pool;
    } catch (error) {
        console.log('Database Connection Failed: ', error);
    }
};


