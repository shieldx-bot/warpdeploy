// Tính toán resources
import { Request, Response ,NextFunction } from "express";
import { Router } from "express";
const router = Router();
import { pool as poolPromise } from '../Database/sqlConfig';


router.post('/resources_usage', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {container_id, metrics, Image}  = req.body; 
        const pool =  await poolPromise;
        const stats = JSON.parse(metrics);

        if(!pool){ 
            throw new Error('Database connection pool is not available');
        }
        const sql = `
        insert into getContainerStats (image_name,  container_id, container_name,BlockIO,  CPUPerc, MemPerc, MemUsage, NetIO, PIDs)
        values (@image_name, @container_id, @container_name, @BlockIO, @CPUPerc, @MemPerc, @MemUsage, @NetIO, @PIDs)
        `;
        const request = pool.request();
        request.input('image_name', Image);
        request.input('container_id', container_id);
        request.input('container_name', stats.Name);
        request.input('BlockIO', stats.BlockIO);
        request.input('CPUPerc', stats.CPUPerc);
        request.input('MemPerc', stats.MemPerc);
        request.input('MemUsage', stats.MemUsage);
        request.input('NetIO', stats.NetIO);
        request.input('PIDs', stats.PIDs);
        await request.query(sql);
        res.status(200).json({ message: 'Metrics saved successfully' });

    } catch(error: any){
        console.error('Error saving metrics:', error);
        res.status(500).json({ message: 'Error saving metrics', error: error.message });
    }
});


export default router;