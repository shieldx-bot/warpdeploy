 const sqlConfig = require('./config').sqlConfig;
import * as sql from 'mssql';

export const connectDB = async() => {
    try { 
        const pool = await sql.connect(sqlConfig);
        if(pool.connected){ 
          console.log("Database Connected")
        } else { 
            console.log("Database Not Connected")
        }
    } catch (error){ 
        console.log("Database Connection Failed: ", error)
    }
}

