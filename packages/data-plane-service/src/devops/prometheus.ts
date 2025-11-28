const client = require('prom-client');

const register = new client.Registry();

const httpRequestCounter = new client.Counter({
    name: 'http_request_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
})


