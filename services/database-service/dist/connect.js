"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPool;
const mssql_1 = __importDefault(require("mssql"));
const sqlConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'MyStrongP@ssw0rd!',
    server: process.env.DB_SERVER || 'localhost',
    database: 'warpdeploy',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: Number(process.env.DB_PORT) || 1433,
    connectionTimeout: process.env.DB_CONNECTION_TIMEOUT ? Number(process.env.DB_CONNECTION_TIMEOUT) : 15000,
    requestTimeout: process.env.DB_REQUEST_TIMEOUT ? Number(process.env.DB_REQUEST_TIMEOUT) : 15000,
    pool: {
        max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
        min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : 0,
    },
};
function createPool() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(sqlConfig);
            if (!pool.connected) {
                throw new Error('Failed to connect to the database');
            }
            else {
                console.log('Database connection pool created successfully');
            }
        }
        catch (error) {
            console.error('Error creating database connection pool:', error);
        }
        return mssql_1.default.connect(sqlConfig);
    });
}
