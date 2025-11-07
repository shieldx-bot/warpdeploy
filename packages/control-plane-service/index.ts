import express from 'express';
import HealthRouter from './src/api/health';
import MetricsRouter from './src/scheduler/resource-allocator';
const app = express();
const PORT = process.env.PORT || 5304;

app.use(HealthRouter);
app.use(MetricsRouter);

app.get('/health', async (req, res) => {
    res.send('Hello from Control Plane Service!');
})

app.get('/', async (req, res) => {
    res.send('Welcome to the Control Plane Service!');
})

app.listen(PORT, () => {
    console.log(`Control Plane Service is running on port ${PORT}`);
});