 const sqlConfig = require('./config').sqlConfig;
import * as sql from 'mssql';
const fs = require('fs');
const path = require('path');
export const connectDB = async() => {
    try { 
        const pool = await sql.connect(sqlConfig);
        const schemaFilePath  = path.join(__dirname, 'schema.sql');
        let sqlSchema = fs.readFileSync(schemaFilePath, 'utf8');
        pool.query(sqlSchema, (err: any, result: any) => { 
            if(err){ 
                console.error('Error executing SQL schema:', err);
            } 
            console.log('SQL schema executed successfully.');
    
        } );
        if(pool.connected){ 
          console.log("Database Connected")
        } else { 
            console.log("Database Not Connected")
        }
    } catch (error){ 
        console.log("Database Connection Failed: ", error)
    }
}

