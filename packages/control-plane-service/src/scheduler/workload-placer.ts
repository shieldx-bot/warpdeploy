// Quyết định deploy lên cluster nào
// Cân nhắc resource, địa lý, chi phí, v.v...

import Router from 'express'
const router = Router();
import { NodeSSH } from 'node-ssh'
const ssh = new NodeSSH();
import { pool as poolPromise } from '../Database/sqlConfig';
const hostname = ''
const username = ''
async function ConnectSSHFunction() {
    try {
        await ssh.connect({
            host: 'your_server_ip',
            username: 'your_username',
            password: 'your_password', // Or use privateKey
        })
       return ssh
    } catch (error) {
        console.log("Connect SSH VPS Faild");
    }
}
async function getClusterFreeTime(){
 try { 
            const pool = await poolPromise;
            if(!pool){
                throw new Error('Database connection pool is not available');
             }
            const result = await pool.request().query('SELECT * FROM Node WHERE status = \'active\'');
            return result.recordset;
        } catch (error) {
            console.error('Error fetching cluster free time:', error);
         }
}


/// đoạn này hãy gọi api đến AI ML kèm một payload để lấy được kết quả nên đặt pod lên node nào
// trước đó ta phải đo được các thông số yêu cầu một pod khi deploy
// và đo được các thông số hiện tại của các node trong cluster
// từ đó ta mới có thể so sánh và đưa ra quyết định đúng đắn được
router.post('/choose-cluster', async (req, res) => {
   try {
    const { Image } = req.body;
    const clusters = await getClusterFreeTime();
    const sql = `SELECT * FROM getContainerStats WHERE image_name = @image_name`
    const pool = await poolPromise;
    const result = await pool.request().input('image_name', Image).query(sql);
    // So sánh và quyết định cluster nào phù hợp
    res.json({ clusters: clusters, containerStats: result.recordset });
   } catch(error){
       console.error('Error choosing cluster:', error);
       res.status(500).json({ error: 'Failed to choose cluster' });
   }
})