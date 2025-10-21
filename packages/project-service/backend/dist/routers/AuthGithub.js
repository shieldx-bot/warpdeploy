"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require('express');
const router = Router();
const axios = require('axios');
router.post('/auth/github/get_access_token', async (req, res) => {
    const { code } = req.body;
    const access_token_response = await axios.post("https://github.com/login/oauth/access_token" + code);
    if (access_token_response.data.error) {
        const message = {
            err: 'Log server: Post Access Token to github error',
            code: 'Router-Auth-001'
        };
        return res.json(message);
    }
    return res.json(access_token_response.data);
});
module.exports = router;
//# sourceMappingURL=AuthGithub.js.map