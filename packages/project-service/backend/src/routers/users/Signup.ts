import express, { type Request, type Response } from 'express';
import pool from '../../config/databse.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();
const db = pool as any;


router.post ( 
    '/signup', async(req: Request, res: Response) => {
    const {email, username, password} = req.body;
    const hash = await bcrypt.hash(password, 10);
        try { 
            const sql = `
        insert into Users(email, username, password_hash) value ($1, $2, $3)
        `
    await db.query(sql, [email, username, hash])
        res.status(20).json({status: 'success'})
        } catch(error){ 
            res.status(500).json({status: 'error', message: error})
        }
        
    }
)

export default router;