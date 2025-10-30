const fs = require("fs");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { getParmasMem, getParmasDisk, getParmasNet, getParmasLogged } = require("./getMetrix");
const connectDB = require("../../Database/Connect");
const ssh = new NodeSSH();
const poolPromise = require('../../Database/sqlConfig').pool;
 

const connectSSH = async (host, username) => {

ssh.connect({
    // host: "ec2-13-230-222-83.ap-northeast-1.compute.amazonaws.com",
    // username: "ubuntu",
    host: host,
    username: username,
    privateKey: fs.readFileSync(
      path.join(__dirname, "./key/kubectl.pem"),
      "utf8"
    ),
  })
  .then(async function () {
    // const [cpu, mem, disk, net, logged] =
    //   await Promise.all([
    //     ssh.execCommand("top -bn1 | grep 'Cpu(s)'"),
    //     ssh.execCommand("free -m"),
    //     ssh.execCommand("df -h"),
    //     ssh.execCommand("ifstat 1 1 | tail -n 1"),
    //     ssh.execCommand("last"),
    //  ]);
    //  const conn = await poolPromise;
    // if (!conn) {
    //   console.error('Database pool is not available (connection failed earlier).');
    // } else {
    //   const result = await conn.request().query(sql);
    //   console.log('DB rows:', result.recordset);
    // }
    const ip = await ssh.execCommand("curl ifconfig.me");
    
    console.log("SSH Connection established: ", ip.stdout);
    return { 
      status: 'success',
      ip : ip.stdout
    };
  })
  .catch(function (err) {
    return {
      status: 'erorr',
      message: error 

    }
   });

  return ssh;


}
module.exports = { connectSSH };