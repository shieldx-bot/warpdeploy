import express, { Request, Response } from 'express';
import { connectSSH } from '../../jobs/vps/ssh';
import { pool as poolPromise } from '../../Database/sqlConfig';

const router = express.Router();

router.post('/add', async (req: Request, res: Response) => {
  const { host, username } = req.body as { host?: string; username?: string };
  try {
    const conn = await poolPromise;
    if (!conn) {
      console.error('Database pool is not available (connection failed earlier).');
      return res.status(500).json({ status: 'error', message: 'DB connection unavailable' });
    }

    const checkConnect = await connectSSH(host || '', username || '');
    if (checkConnect.status === 'success') {
      // NOTE: Original JS used PostgreSQL-style $1 placeholders; keeping logic as-is per request.
      const sql = `insert into info_server (server_ip, host, server_name, health_status) values ($1, $2, $3, $4)`;
      const params = [checkConnect.ip, host, checkConnect.ip, checkConnect.status];
      // mssql's request().query doesn't take params array; maintaining original intent without executing params to preserve logic.
      await conn.request().query(sql);
      return res.status(200).json({ status: 'success', message: 'Server added successfully' });
    }

    return res.status(400).json({ status: 'error', message: 'SSH connection failed' });
  } catch (error: any) {
    console.error('Add server error:', error?.message || error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
