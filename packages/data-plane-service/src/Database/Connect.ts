import sql from 'mssql';
import { sqlConfig } from './sqlConfig';

const connectDB = async (): Promise<sql.ConnectionPool | undefined> => {
  try {
    const pool = await sql.connect(sqlConfig);
    if ((pool as any).connected) {
      console.log('Database Connected');
    } else {
      console.log('Database Not Connected');
    }
    return pool;
  } catch (error) {
    console.log('Database Connection Failed: ', error);
  }
};

export default connectDB;
