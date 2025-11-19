import express from 'express';
import pool from '../../config/databse.js';
import { type Irepos } from '../../types/index.js';

const router = express.Router();

// Get repositories for a given user email from Postgres
router.get('/GetReposDB', async (req, res) => {
    try {
        const emailFromQuery = typeof req.query.email === 'string' ? req.query.email : undefined;
        const emailFromBody = (req.body && typeof req.body.email === 'string') ? req.body.email : undefined;
        const email = emailFromQuery || emailFromBody;

        if (!email) {
            return res.status(400).json({ status: 'error', message: 'email is required' });
        }

        const sql = 'SELECT name, full_name, html_url FROM Repos WHERE email = $1';
        const { rows } = await pool.query(sql, [email]);

        return res.json({ status: 'success', data: rows as Irepos[] });
    } catch (err) {
        console.error('GetReposDB error:', err);
        return res.status(500).json({ status: 'error', message: 'Database query failed' });
    }
});

export default router;



router.post('/deployment-repo', async(req,res)=> {

})