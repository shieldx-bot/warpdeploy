import express from 'express';
import HealthRouter from './src/api/health';
import MetricsRouter from './src/scheduler/resource-allocator';
const app = express();
const PORT = process.env.PORT || 3032;

app.use(HealthRouter);
app.use(MetricsRouter);

app.listen(PORT, () => {
    console.log(`Control Plane Service is running on port ${PORT}`);
});