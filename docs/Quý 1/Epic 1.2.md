# Epic 1.2: Reliability & Resilience Patterns - Chi tiết Dễ Hiểu

## 🎯 Tổng Quan
**Mục tiêu:** Xây dựng hệ thống có khả năng tự phục hồi khi gặp lỗi, tránh duplicate operations, và đảm bảo không có điểm yếu dẫn đến sự cố cascading.

**Timeline:** Tuần 3-6 (1 tháng) | **Priority:** P0 (Critical - phải làm ngay)

---

## 📦 Chi Tiết Từng Component

### 1. Idempotency Keys System (Hệ thống Tránh Duplicate Operations)

#### ❓ **Vấn đề cần giải quyết:**
```
Ví dụ thực tế:
- User click nút "Deploy" 2 lần liên tục
- Network retry gửi request deploy 5 lần
→ Hệ thống tạo 5 deployments giống nhau → Lãng phí tài nguyên, data conflict

Giải pháp: Idempotency = "Thực hiện N lần = Thực hiện 1 lần"
```

#### 🔧 **Cách hoạt động:**

**Bước 1: Generate Idempotency Key**
```javascript
// Tự động tạo key từ request
const idempotencyKey = SHA256(
  request.body + 
  request.headers['user-id'] + 
  timestamp_rounded_to_minute
);

// Ví dụ key: "a3f2c9d8e1b4..."
```

**Bước 2: Check Redis Cache**
```javascript
// Middleware kiểm tra trước khi xử lý request
if (redis.exists(idempotencyKey)) {
  // Request này đã xử lý rồi!
  return redis.get(idempotencyKey); // Trả về kết quả cũ
}

// Chưa xử lý → Tiếp tục xử lý request
processRequest();

// Lưu kết quả vào cache (TTL 24h)
redis.set(idempotencyKey, response, 'EX', 86400);
```

**Bước 3: Automatic Retry với Exponential Backoff**
```javascript
// Retry logic thông minh
Attempt 1: Gửi ngay lập tức
Attempt 2: Đợi 1s + random(0-500ms) → Gửi lại
Attempt 3: Đợi 2s + random(0-1000ms) → Gửi lại
Attempt 4: Đợi 4s + random(0-2000ms) → Gửi lại
...
Max attempts: 5 lần → Fail definitively
```

#### 📋 **Deliverables (Sản phẩm cụ thể):**

1. **Express.js Middleware Package**
```javascript
// Usage example
const idempotencyMiddleware = require('./idempotency');

app.post('/api/deploy', 
  idempotencyMiddleware({ ttl: 86400, maxRetries: 5 }),
  deployController
);
```

2. **Redis Lua Scripts** (Atomic operations - không bị race condition)
```lua
-- check_and_set.lua
local key = KEYS[1]
local value = ARGV[1]
local ttl = ARGV[2]

if redis.call('exists', key) == 1 then
  return redis.call('get', key)  -- Đã tồn tại
else
  redis.call('setex', key, ttl, value)  -- Set mới
  return nil
end
```

3. **Configuration Schema**
```yaml
idempotency:
  ttl: 86400  # 24 hours
  maxRetries: 5
  backoffMultiplier: 2
  maxBackoff: 30000  # 30s max
  jitterRange: 0.3  # ±30% random
```

4. **Integration Tests**
```javascript
describe('Idempotency Middleware', () => {
  it('should prevent double deployment', async () => {
    // Gửi 1000 concurrent requests giống nhau
    const promises = Array(1000).fill().map(() => 
      axios.post('/api/deploy', { app: 'test' })
    );
    
    const results = await Promise.all(promises);
    
    // Assert: Chỉ 1 deployment được tạo
    expect(actualDeployments).toBe(1);
  });
});
```

---

### 2. Circuit Breaker Implementation (Cô Lập Lỗi)

#### ❓ **Vấn đề cần giải quyết:**
```
Tình huống:
- GitHub API down → Hệ thống cứ gọi GitHub liên tục
- 10,000 requests/s đều fail → Lãng phí tài nguyên
- System overload → Ảnh hưởng toàn bộ services

Giải pháp: Circuit Breaker = "Ngắt mạch tự động khi phát hiện lỗi"
```

#### 🔧 **Cách hoạt động:**

**State Machine:**
```
CLOSED (Bình thường)
  ↓ (Lỗi nhiều quá, vượt threshold)
OPEN (Ngắt kết nối, reject requests ngay)
  ↓ (Sau 30s)
HALF_OPEN (Thử 1 request)
  ↓ (Success → CLOSED) hoặc (Fail → OPEN)
```

**Code Example:**
```javascript
const CircuitBreaker = require('opossum');

// Wrap GitHub API call
const breaker = new CircuitBreaker(githubAPI.getRepo, {
  timeout: 3000,          // Request timeout
  errorThresholdPercentage: 50,  // 50% lỗi → OPEN
  resetTimeout: 30000,    // 30s sau sẽ thử HALF_OPEN
  rollingCountTimeout: 10000     // Đếm lỗi trong 10s gần nhất
});

// Fallback strategy khi circuit OPEN
breaker.fallback(() => {
  // Trả về cached data hoặc default value
  return cache.get('github-repo') || { status: 'unavailable' };
});

// Monitoring
breaker.on('open', () => {
  console.log('Circuit OPEN - GitHub API down!');
  metrics.increment('circuit.github.open');
});

breaker.on('halfOpen', () => {
  console.log('Circuit HALF_OPEN - Testing recovery...');
});
```

#### 📋 **Deliverables:**

1. **Circuit Breaker Wrapper Library**
```javascript
// services/circuit-breaker.js
class ServiceCircuitBreaker {
  constructor(service, options) {
    this.breaker = new CircuitBreaker(service, options);
    this.setupFallback();
    this.setupMetrics();
  }
  
  async call(...args) {
    return this.breaker.fire(...args);
  }
}

// Usage
const githubBreaker = new ServiceCircuitBreaker(githubAPI, {
  name: 'github',
  timeout: 3000,
  errorThresholdPercentage: 50
});
```

2. **Configuration per Service**
```yaml
circuit_breakers:
  github:
    timeout: 3000
    errorThreshold: 50%
    resetTimeout: 30s
    fallback: cached_data
  
  kubernetes_api:
    timeout: 5000
    errorThreshold: 30%
    resetTimeout: 60s
    fallback: graceful_degradation
```

3. **Grafana Dashboard**
```
Panel 1: Circuit Breaker States (Timeline)
- CLOSED (green)
- OPEN (red)
- HALF_OPEN (yellow)

Panel 2: Request Success/Failure Rate
Panel 3: Fallback Activation Count
Panel 4: Mean Time Between Failures
```

---

### 3. Dead Letter Queue (DLQ) Setup (Xử Lý Failed Messages)

#### ❓ **Vấn đề cần giải quyết:**
```
Tình huống:
- RabbitMQ message processing fails (DB down, validation error)
- Message bị mất hoặc retry vô hạn
- Không có cách nào recover failed messages

Giải pháp: DLQ = "Hộp thư chết" để lưu messages xử lý failed
```

#### 🔧 **Cách hoạt động:**

**RabbitMQ Configuration:**
```
Normal Queue → Processing fails
  ↓ (Retry 1: sau 1s)
Normal Queue → Processing fails again
  ↓ (Retry 2: sau 5s)
Normal Queue → Processing fails again
  ↓ (Retry 3: sau 30s)
Normal Queue → Processing fails → Move to DLQ
  ↓
Dead Letter Queue (Lưu trữ, chờ manual intervention)
```

**Code Example:**
```javascript
// RabbitMQ queue setup
await channel.assertQueue('deployment.queue', {
  deadLetterExchange: 'deployment.dlx',
  deadLetterRoutingKey: 'deployment.failed',
  arguments: {
    'x-max-length': 10000,  // Max queue size
    'x-message-ttl': 3600000  // 1 hour TTL
  }
});

// DLQ setup
await channel.assertQueue('deployment.dlq', {
  durable: true,
  arguments: {
    'x-queue-mode': 'lazy'  // Disk-backed for large queues
  }
});

// Consumer with retry logic
channel.consume('deployment.queue', async (msg) => {
  try {
    await processDeployment(msg);
    channel.ack(msg);  // Success
  } catch (error) {
    const retryCount = msg.properties.headers['x-retry-count'] || 0;
    
    if (retryCount < 3) {
      // Retry với delay
      await sleep(Math.pow(2, retryCount) * 1000);
      channel.nack(msg, false, true);  // Requeue
    } else {
      // Move to DLQ
      channel.nack(msg, false, false);  // Don't requeue
    }
  }
});
```

#### 📋 **Deliverables:**

1. **RabbitMQ Configuration Files**
```yaml
# exchanges.yaml
exchanges:
  - name: deployment.exchange
    type: topic
  - name: deployment.dlx  # Dead Letter Exchange
    type: topic

# queues.yaml
queues:
  - name: deployment.queue
    bindings:
      - exchange: deployment.exchange
        routing_key: deployment.*
    dlx: deployment.dlx  # Link to DLX
  
  - name: deployment.dlq
    bindings:
      - exchange: deployment.dlx
        routing_key: deployment.failed
```

2. **DLQ Replay Service (Admin API)**
```javascript
// POST /api/admin/dlq/replay
app.post('/api/admin/dlq/replay', async (req, res) => {
  const { messageId, targetQueue } = req.body;
  
  // Get message from DLQ
  const msg = await dlq.getMessage(messageId);
  
  // Reset retry count
  msg.properties.headers['x-retry-count'] = 0;
  
  // Re-publish to original queue
  await channel.publish(
    'deployment.exchange',
    'deployment.create',
    msg.content,
    msg.properties
  );
  
  // Remove from DLQ
  await dlq.deleteMessage(messageId);
  
  res.json({ status: 'replayed' });
});
```

3. **Alert Rules**
```yaml
# prometheus-alerts.yaml
groups:
  - name: dlq_alerts
    rules:
      - alert: DLQSizeHigh
        expr: rabbitmq_queue_messages{queue="deployment.dlq"} > 100
        for: 5m
        annotations:
          summary: "DLQ size exceeded threshold"
          description: "{{ $value }} messages in DLQ"
```

---

### 4. Health Checks & Probes (Kubernetes Health Monitoring)

#### ❓ **Vấn đề cần giải quyết:**
```
Tình huống:
- Service đang chạy nhưng DB connection pool exhausted
- Pod "running" nhưng không thể serve traffic
- Kubernetes không biết pod unhealthy → Vẫn route traffic

Giải pháp: Comprehensive health checks với 3 levels
```

#### 🔧 **Cách hoạt động:**

**3 Types of Probes:**

1. **Startup Probe** (Pod đã start xong chưa?)
```javascript
app.get('/startup', (req, res) => {
  // Check: Application initialization done?
  if (app.isInitialized) {
    res.status(200).send('OK');
  } else {
    res.status(503).send('Starting...');
  }
});
```

2. **Liveness Probe** (Pod còn sống không?)
```javascript
app.get('/health', async (req, res) => {
  // Deep health check
  const checks = await Promise.all([
    checkDatabase(),       // Ping PostgreSQL
    checkRedis(),          // Ping Redis
    checkRabbitMQ(),       // Check queue connection
    checkExternalAPIs()    // Check GitHub, K8s API
  ]);
  
  if (checks.every(c => c.healthy)) {
    res.status(200).json({
      status: 'healthy',
      checks: checks
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      checks: checks
    });
  }
});
```

3. **Readiness Probe** (Pod sẵn sàng nhận traffic chưa?)
```javascript
app.get('/ready', (req, res) => {
  // Shallow check (fast!)
  if (app.isReady) {
    res.status(200).send('Ready');
  } else {
    res.status(503).send('Not ready');
  }
});
```

**Kubernetes Configuration:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-gateway
spec:
  containers:
  - name: api
    image: api-gateway:v1.0
    ports:
    - containerPort: 3000
    
    # Startup probe: Chờ app khởi động (slow startup OK)
    startupProbe:
      httpGet:
        path: /startup
        port: 3000
      failureThreshold: 30     # Chờ tối đa 30 * 10s = 5 phút
      periodSeconds: 10
    
    # Liveness probe: Kill pod nếu unhealthy
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 15  # Chờ 15s sau startup
      periodSeconds: 10        # Check mỗi 10s
      timeoutSeconds: 5        # Timeout sau 5s
      failureThreshold: 3      # Fail 3 lần liên tục → Kill pod
    
    # Readiness probe: Remove từ load balancer nếu not ready
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2      # Fail 2 lần → Remove from service
```

#### 📋 **Deliverables:**

1. **Health Check Middleware Library**
```javascript
// lib/health-check.js
class HealthChecker {
  constructor() {
    this.checks = [];
  }
  
  addCheck(name, checkFn) {
    this.checks.push({ name, checkFn });
  }
  
  async runChecks() {
    const results = await Promise.all(
      this.checks.map(async (check) => ({
        name: check.name,
        healthy: await check.checkFn(),
        timestamp: Date.now()
      }))
    );
    
    return {
      healthy: results.every(r => r.healthy),
      checks: results
    };
  }
}

// Usage
const healthChecker = new HealthChecker();
healthChecker.addCheck('postgres', checkPostgres);
healthChecker.addCheck('redis', checkRedis);
healthChecker.addCheck('rabbitmq', checkRabbitMQ);
```

2. **Dependency Health Checkers**
```javascript
// checks/postgres.js
async function checkPostgres() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Postgres health check failed:', error);
    return false;
  }
}

// checks/redis.js
async function checkRedis() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
```

---

## 📊 Success Criteria (KPIs) - Giải Thích

| Metric | Target | Ý nghĩa |
|--------|--------|---------|
| **Idempotency deduplication rate = 100%** | Redis cache metrics | Mọi duplicate request đều bị phát hiện và block |
| **Double-deployment prevention = 0** | Chaos test | Gửi 1000 concurrent requests → Chỉ 1 deployment được tạo |
| **Cache hit rate ≥ 85%** | Redis INFO stats | 85% requests là duplicate (cache hoạt động tốt) |
| **Circuit breaker recovery < 30s** | Circuit metrics | Service recovery nhanh sau khi OPEN |
| **Failed request rate < 0.1%** | Prometheus | Hệ thống rất stable (99.9% success) |
| **DLQ capture rate = 100%** | RabbitMQ | Không mất message nào khi processing fails |
| **DLQ replay success ≥ 95%** | Replay logs | Replay failed messages thành công |
| **Health check latency < 10ms** | Endpoint timing | Health check không làm chậm system |
| **Zero traffic to unhealthy pods** | K8s events | Kubernetes routing đúng (không gửi traffic đến pod unhealthy) |

---

## ⚠️ Risks & Mitigation - Giải Thích

### Risk 1: Redis Cache Failure
**Vấn đề:** Redis down → Tất cả requests bị reject (vì không check được idempotency)

**Giải pháp:**
```javascript
// Fallback: Stateless idempotency check
if (!redis.isConnected()) {
  // Check trong time window ngắn (5 phút)
  const existingRequest = await db.query(
    'SELECT * FROM requests WHERE hash = $1 AND created_at > NOW() - INTERVAL "5 minutes"',
    [requestHash]
  );
  
  if (existingRequest) {
    return cachedResponse;  // Duplicate trong 5 phút gần nhất
  }
}
```

### Risk 2: Circuit Breaker False Positive
**Vấn đề:** GitHub API có 1-2 requests fail → Circuit breaker OPEN → Service unavailable

**Giải pháp:**
```javascript
// Tuning thresholds dựa trên historical data
const breaker = new CircuitBreaker(githubAPI, {
  errorThresholdPercentage: 50,  // 50% error rate (không phải 1-2 errors)
  volumeThreshold: 10,            // Cần ít nhất 10 requests mới tính
  rollingCountTimeout: 30000      // Trong 30s gần nhất
});

// Manual override capability
app.post('/admin/circuit-breaker/override', (req, res) => {
  const { service, state } = req.body;
  circuitBreakers[service].forceState(state);  // Force CLOSED
});
```

### Risk 3: DLQ Infinite Retry Loop
**Vấn đề:** Message fail → Retry → Fail → Retry... (vô hạn)

**Giải pháp:**
```javascript
const MAX_RETRIES = 3;
const MAX_BACKOFF = 30000;  // 30s ceiling

if (retryCount >= MAX_RETRIES) {
  // Move to DLQ - STOP retrying
  channel.nack(msg, false, false);
  
  // Alert admin
  await notifyAdmin({
    message: 'Message moved to DLQ after 3 retries',
    messageId: msg.properties.messageId,
    error: lastError
  });
}
```

---

## 🎯 Tóm Tắt

**Epic này giải quyết 4 vấn đề cốt lõi:**

1. ✅ **Idempotency:** Tránh duplicate operations (user click nhiều lần)
2. ✅ **Circuit Breaker:** Cô lập lỗi (external API down không ảnh hưởng toàn hệ thống)
3. ✅ **Dead Letter Queue:** Không mất message khi processing fails
4. ✅ **Health Checks:** Kubernetes biết pod nào healthy để route traffic đúng

**Kết quả:** Hệ thống **resilient** (tự phục hồi), **reliable** (không mất data), và **stable** (99.9% uptime).