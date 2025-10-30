const sql = require('mssql');
const fs = require ('fs');
const path =  require('path');
const { fileURLToPath } = require('url');
const { sqlConfig } = require ( './sqlConfig');

 const connectDB = async () => {
    try {
        const pool = await sql.connect(sqlConfig);
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

module.exports = connectDB;

