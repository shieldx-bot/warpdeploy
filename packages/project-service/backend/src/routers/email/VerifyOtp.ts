import express, { type Request, type Response } from 'express';
import pool from '../../config/databse.js';
import authenticateToken from '../../middleware/auth.js';
const router = express.Router();
const db = pool as any;


router.post(
    '/verify-otp',    async(req:Request, res:Response) =>{
        const {email, otp} = req.body;
        try { 
            const sql = `
            select * from  VerifyOtp where email = $1 and otp = $2
            and created_at >= NOW() -INTERVAL '10 minutes'
            `
            const [rows, fields] = await db.query(sql, [email, otp]);
        
            if(rows.length > 0){
                const sqlDelete  =`
                delete VerifyOtp where email = $1
                ` 
                await db.query(sqlDelete, [email]);
                res.status(200).json({ status: 'success', message: 'OTP verified successfully' });
            } else { 
                res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            }
        }catch(error){ 
            res.status(500).json({ status: 'error', message: 'Failed to verify OTP' });
        }
    }
)


export default router