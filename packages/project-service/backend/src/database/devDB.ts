import sql from 'mssql/msnodesqlv8';

const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'test',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true, // dùng Windows Authentication
  },
};

export const connectDB = async() => {
  try {
    await sql.connect(config);
    console.log("✅ Connected to SQL Server!");
    
    const result = await sql.query`SELECT name FROM sys.databases`;
    console.log(result.recordset);
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

