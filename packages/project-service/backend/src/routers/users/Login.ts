import express, { type Request, type Response } from 'express';
import pool from '../../config/databse.js';
const db = pool as any;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { generateRefreshToken } from '../../utils/jwt.js';
dotenv.config();
const router = express.Router();



router.post( 
    '/login',  async(req: Request, res: Response) => {
    const {email, password} = req.body 
    try{
        const sql = `select *  from Users where email = $1`
        const [rows, fields] = await db.query(sql, [email]);
        if(rows.length === 0){ 
            return res.status(400).json({status: 'error', message: 'User not found'});
        }  
            const user = rows[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if(!validPassword){ 
                return res.status(400).json({status: 'error', message: 'Invalid password'});
            }
            
            const token = await generateRefreshToken(email);
            res.status(200).json({status: 'success', token: token });
    } catch(error){ 
        res.status(500).json({status: 'error', message: 'Login failed' });
    }



    }
)




async function validateUserCredentials(username: string, password: string): Promise<boolean>  { 
    return true;
}

export default router;