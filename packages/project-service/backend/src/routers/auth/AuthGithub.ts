const Router = require('express');
import { type Request, type Response } from 'express';
const router = Router();
const axios = require('axios');
import dotenv from 'dotenv';
dotenv.config();




router.post(
  '/get_access_token', async (req: Request, res: Response) => {
    const { code }: any = req.body;
    console.log("Received code:", code);
    try {
      const client_id = 'Ov23lik3HiCw8svL1G5f';
      const client_secret = 'e54c53ca22866af6b7cee6c0dc0e0fb92d2365b5';
      console.log("Client ID and Secret loaded from env", client_id);
      const access_token_response = await axios.post(
        "https://github.com/login/oauth/access_token", {
        client_id: client_id,
        client_secret: client_secret,
        code: code,
      }, {
        headers: {
          Accept: 'application/json'
        }
      }
      )
      console.log("Access Token Response Data:", access_token_response.data);
      if (access_token_response.data.error) {
        const message = {
          err: access_token_response.data.error_description,
          code: 'Router-Auth-001'
        }
        return res.json(message)
      }
      const repo = await axios.get('https://api.github.com/user/repos?per_page=100', {
        headers: { // Sửa "Headers" thành "headers"
          Authorization: `bearer ${access_token_response.data.access_token}`,
          Accept: 'application/vnd.github.v3+json',
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });


      return res.status(200).json({
        status: 'success',
        access_token: access_token_response.data.access_token,
        dataRepo: repo.data
      })
    } catch (error) {
      console.error("Error in /get_access_token:", error)
    }
  }
)






 

module.exports = router;