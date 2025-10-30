const cron = require("node-cron");
const { connectSSH } = require("../vps/ssh");


cron.schedule("*/10 * * * * * ",async(req,res)=> {
    console.log("Cron job started: Checking VPS status...");
    
    
})