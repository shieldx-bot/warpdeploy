import { Request, Response, NextFunction } from "express";
import { Router } from "express";
const router = Router();




router.get( '/health', async(req: Request, res:Response, next: NextFunction) => { 
    res.status(200).send("Control Plane Service is healthy");
})

export default router;