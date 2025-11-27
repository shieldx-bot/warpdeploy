import { Request, Response, Router } from 'express';
import axios from 'axios';
const router = Router();
import pool from '../../config/databse.js';
import { Irepos } from '../../types/index.js';



router.post(
    '/get_access_token', async (req: Request, res: Response) => {
        const { code }: any = req.body;
        console.log("Received code:", code);
        try {
            const client_id = process.env.GITLAB_CLIENT_ID as string | undefined;
            const client_secret = process.env.GITLAB_CLIENT_SECRET as string | undefined;
            const redirect_uri = (process.env.GITLAB_REDIRECT_URI as string | undefined) ?? 'http://localhost:5173/import-repos';
   console.log("=== DEBUG GITLAB OAUTH ===");
            console.log("Client ID:", client_id);
            console.log("Client Secret exists?", !!client_secret);
            console.log("Client Secret length:", client_secret?.length ?? 0);
            console.log("Redirect URI:", redirect_uri);
            console.log("========================");
            if (!client_id || !client_secret) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Missing GITLAB_CLIENT_ID or GITLAB_CLIENT_SECRET in backend .env',
                });
            }
 
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri,
            });

            const tokenRes= await axios.post(
                'https://gitlab.com/oauth/token',
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                    },
                    // Use HTTP Basic for client authentication (preferred by Doorkeeper)
                    auth: { username: client_id, password: client_secret },
                    timeout: 15000,
                }
            );

            console.log("Access Token Response Data:", tokenRes.data);
            return res.status(200).json({ status: 'success', data: tokenRes.data })
        } catch (err: any) {
            const status = err?.response?.status ?? 400;
            const data = err?.response?.data;
            console.error('GitLab token error:', data || err?.message);
            return res.status(status).json({
                status: 'error',
                message: data?.error_description || data?.error || err?.message || 'GitLab token exchange failed',
            });
        }
    }
)


router.get(
    '/get_repositories', async(req: Request, res: Response) => { 
        const email =  'abcgohan123mam@gmail.om'
        const access_token = req.headers.authorization?.split(' ')[1];
        console.log("Received access token for repo fetch:", access_token);
        if(!access_token){
            return res.status(400).json({status: 'error', message: 'Access token missing' });
        }
       try{ 
         const response = await axios.get<Irepos[]>('https://gitlab.com/api/v4/projects?membership=true&per_page=100', { 
            headers: { 
                Authorization: `Bearer ${access_token}`, 
                Accept: 'application/json',

            }
        })
          console.log("GitLab Repositories Response:", response.data)
                        const Repos: Irepos[] = response.data;
                        // Persist repos asynchronously; don't block response
                        const insertSql = `
                            INSERT INTO Repos (name, full_name, html_url, email) VALUES ($1, $2, $3, $4)
                        `;
                                    void Promise.all(
                                        Repos.map((repo: Irepos) =>
                                            pool
                                                .query(insertSql, [repo.name, repo.full_name, repo.html_url, email])
                                                .catch((e: unknown) => {
                                                    console.error('Failed to insert repo', repo.full_name, e);
                                                })
                                        )
                                    );
          
         
            return res.status(200).json({status: 'success', data: response.data });
        
       } catch(error){
        return res.status(500).json({status: 'error', message: 'Error fetching repositories', error: error });
       }
    }
)
router.post

export default router;