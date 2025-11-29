// src/index.ts
import express, { Express, Request, Response } from 'express';
import createPool from './connect';




const app: Express = express();
app.use(express.json());


const port = process.env.PORT || 3000;

app.get('/', async (req: Request, res: Response) => {
    const sql = 'select *  from cloud_server_user'
    const pool = await createPool();
    const result = await pool.request().query(sql);
    console.log(result);

    res.send('Hello from TypeScript Express!');
});


app.post('/add_server_user', async (req: Request, res: Response) => {
    const { clusterServer, certificateAuthorityData, clientCertificateData, clientKeyData, token, namespace, clusterName, contextName } = req.body;
    try {
        const sql = `
        INSERT INTO cloud_server_user (cluster_server, certificate_authority_data, client_certificate_data, client_key_data, token, namespace, cluster_name, context_name)
        VALUES (@cluster_server, @certificate_authority_data, @client_certificate_data, @client_key_data, @token, @namespace, @cluster_name, @context_name)`
        const pool = await createPool();
        const request = pool.request();
        request.input('cluster_server', clusterServer);
        request.input('certificate_authority_data', certificateAuthorityData);
        request.input('client_certificate_data', clientCertificateData);
        request.input('client_key_data', clientKeyData);
        request.input('token', token);
        request.input('namespace', namespace);
        request.input('cluster_name', clusterName);
        request.input('context_name', contextName);
        await request.query(sql);
        res.status(201).send('Server user added successfully');
    } catch (error) {
        console.error('Error adding server user:', error);
        res.status(500).send('Internal Server Error');
    }
})





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});