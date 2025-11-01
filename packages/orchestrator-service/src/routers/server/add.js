const express = require('express');
const { connectSSH } = require('../../jobs/vps/ssh');
const poolPromise = require('../../Database/sqlConfig').pool;

const router = express.Router();

router.post('/add', async(req ,res)=>  {
    const {host, username } = req.body;
    try { 

    } catch (error) {
        const conn =  await poolPromise;
        if (!conn)  { 
            console.error('Database pool is not available (connection failed earlier).');
        } else { 
            const checkConnect  = await connectSSH(host, username);
            if(checkConnect.status === 'success') {
                const sql = `insert into info_server (server_ip, host, server_name, health_status) values ($1, $2, $3, $4)`;
                const params = [checkConnect.ip, host, checkConnect.ip, checkConnect.status];
                await conn.request().query(sql, params);
                res.status(200).json({
                    status: 'success',
                    message: 'Server added successfully'
                })
            }
        }
    }
})
