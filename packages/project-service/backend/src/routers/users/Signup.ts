import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
const router = express.Router();


router.post ( 
    '/signup', async(req: Request, res: Response) => {
    const {email, username, password} = req.body;
    const hash = await bcrypt.hash(password, 10);
        try { 
            // TODO: insert user to database when DB is ready
            // const sql = `insert into Users(email, username, password_hash) values ($1, $2, $3)`
            // await db.query(sql, [email, username, hash])
        res.status(501).json({status: 'error', message: 'Signup not implemented yet'})
        } catch(error){ 
            res.status(500).json({status: 'error', message: error})
        }
        
    }
)

export default router;