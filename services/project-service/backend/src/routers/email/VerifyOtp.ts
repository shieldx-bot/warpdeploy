import express, { type Request, type Response } from 'express';
import authenticateToken from '../../middleware/auth.js';
const router = express.Router();


router.post(
    '/verify-otp',    async(req:Request, res:Response) =>{
        const {email, otp} = req.body;
        try { 
            // TODO: verify OTP from database when DB is ready
            // const sql = `select * from VerifyOtp where email = $1 and otp = $2 and created_at >= NOW() -INTERVAL '10 minutes'`
            // const [rows] = await db.query(sql, [email, otp]);
            // if(rows.length > 0) { ... }
            res.status(501).json({ status: 'error', message: 'OTP verification not implemented yet' });
        }catch(error){ 
            res.status(500).json({ status: 'error', message: 'Failed to verify OTP' });
        }
    }
)


export default router