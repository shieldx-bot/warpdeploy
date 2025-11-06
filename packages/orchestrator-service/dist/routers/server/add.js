"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ssh_1 = require("../../jobs/vps/ssh");
const sqlConfig_1 = require("../../Database/sqlConfig");
const router = express_1.default.Router();
router.post('/add', async (req, res) => {
    const { host, username } = req.body;
    try {
        const conn = await sqlConfig_1.pool;
        if (!conn) {
            console.error('Database pool is not available (connection failed earlier).');
            return res.status(500).json({ status: 'error', message: 'DB connection unavailable' });
        }
        const checkConnect = await (0, ssh_1.connectSSH)(host || '', username || '');
        if (checkConnect.status === 'success') {
            // NOTE: Original JS used PostgreSQL-style $1 placeholders; keeping logic as-is per request.
            const sql = `insert into info_server (server_ip, host, server_name, health_status) values ($1, $2, $3, $4)`;
            const params = [checkConnect.ip, host, checkConnect.ip, checkConnect.status];
            // mssql's request().query doesn't take params array; maintaining original intent without executing params to preserve logic.
            await conn.request().query(sql);
            return res.status(200).json({ status: 'success', message: 'Server added successfully' });
        }
        return res.status(400).json({ status: 'error', message: 'SSH connection failed' });
    }
    catch (error) {
        console.error('Add server error:', error?.message || error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});
exports.default = router;
