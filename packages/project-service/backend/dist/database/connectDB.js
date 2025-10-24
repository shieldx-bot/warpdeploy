"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const sqlConfig = require('./config').sqlConfig;
const sql = __importStar(require("mssql"));
const fs = require('fs');
const path = require('path');
const connectDB = async () => {
    try {
        const pool = await sql.connect(sqlConfig);
        const schemaFilePath = path.join(__dirname, 'schema.sql');
        let sqlSchema = fs.readFileSync(schemaFilePath, 'utf8');
        pool.query(sqlSchema, (err, result) => {
            if (err) {
                console.error('Error executing SQL schema:', err);
            }
            console.log('SQL schema executed successfully.');
        });
        if (pool.connected) {
            console.log("Database Connected");
        }
        else {
            console.log("Database Not Connected");
        }
    }
    catch (error) {
        console.log("Database Connection Failed: ", error);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=connectDB.js.map