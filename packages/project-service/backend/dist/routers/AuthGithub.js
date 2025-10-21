"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require('express');
const router = Router();
const axios = require('axios');
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
router.post('/get_access_token', async (req, res) => {
    const { code } = req.body;
    console.log("Received code:", code);
    try {
        const client_id = 'Ov23lik3HiCw8svL1G5f';
        const client_secret = 'e54c53ca22866af6b7cee6c0dc0e0fb92d2365b5';
        console.log("Client ID and Secret loaded from env", client_id);
        const access_token_response = await axios.post("https://github.com/login/oauth/access_token", {
            client_id: client_id,
            client_secret: client_secret,
            code: code,
        }, {
            headers: {
                Accept: 'application/json'
            }
        });
        console.log("Access Token Response Data:", access_token_response.data);
        if (access_token_response.data.error) {
            const message = {
                err: access_token_response.data.error_description,
                code: 'Router-Auth-001'
            };
            return res.json(message);
        }
        return res.json(access_token_response.data);
    }
    catch (error) {
        console.error("Error in /get_access_token:", error);
    }
});
module.exports = router;
//# sourceMappingURL=AuthGithub.js.map