# Epic 1.1: Control Plane / Data Plane Separation - Giải Thích Chi Tiết

## 🎯 Tại Sao Cần Tách Control Plane và Data Plane?

### Vấn Đề Hiện Tại
Hệ thống hiện tại có kiến trúc **monolithic** - tất cả logic (quản lý, điều phối, thực thi) nằm trong một service. Điều này gây ra:

1. **Không scale được độc lập**: Khi cần scale phần thực thi, phải scale cả phần quản lý (lãng phí tài nguyên)
2. **Blast radius lớn**: Một lỗi có thể làm sập cả hệ thống
3. **Khó bảo trì**: Code phức tạp, nhiều responsibility
4. **Không hỗ trợ multi-cluster**: Khó quản lý nhiều Kubernetes clusters

### Giải Pháp: Tách Biệt Hai Tầng

```
┌─────────────────────────────────────┐
│       CONTROL PLANE (Bộ Não)       │
│  - API Gateway (REST)               │
│  - Scheduling Engine                │
│  - State Management (PostgreSQL)    │
│  - Decision Making                  │
└─────────────────────────────────────┘
              ↓ gRPC ↓
┌─────────────────────────────────────┐
│        DATA PLANE (Tay Chân)        │
│  - Agent 1 → Cluster A              │
│  - Agent 2 → Cluster B              │
│  - Agent 3 → Cluster C              │
│  - Thực thi deployment              │
└─────────────────────────────────────┘
```

---

## 📦 Chi Tiết Từng Deliverable

### 1. Control Plane Service Refactoring

**Vai trò**: "Bộ não" của hệ thống - ra quyết định, không thực thi trực tiếp.

#### Kiến Trúc Service

```typescript
// File structure
control-plane-service/
├── src/
│   ├── api/                 # REST API layer
│   │   ├── routes/
│   │   │   ├── deployments.ts
│   │   │   ├── projects.ts
│   │   │   └── health.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── validation.ts
│   │
│   ├── grpc/                # gRPC layer
│   │   ├── server.ts
│   │   ├── handlers/
│   │   │   ├── deployment.handler.ts
│   │   │   └── metrics.handler.ts
│   │   └── interceptors/
│   │
│   ├── scheduler/           # Scheduling engine
│   │   ├── workload-placer.ts    # Quyết định deploy lên cluster nào
│   │   ├── resource-allocator.ts  # Tính toán resources
│   │   └── priority-queue.ts      # Quản lý deployment queue
│   │
│   ├── state/               # State management
│   │   ├── repositories/
│   │   ├── entities/
│   │   └── migrations/
│   │
│   └── events/              # Event publishing
│       └── rabbitmq-publisher.ts
```

#### Ví Dụ API Flow

```typescript
// REST API endpoint
POST /api/v1/deployments
{
  "projectId": "proj-123",
  "image": "myapp:v1.0",
  "replicas": 3,
  "resources": {
    "cpu": "500m",
    "memory": "512Mi"
  }
}

// Control Plane xử lý:
1. Authentication/Authorization
2. Validation
3. Scheduling decision (chọn cluster phù hợp)
4. Lưu state vào PostgreSQL
5. Gọi gRPC → Data Plane Agent
6. Publish event vào RabbitMQ
7. Return response
```

#### Tech Stack Chi Tiết

- **Express.js/Fastify**: REST API framework (Fastify nhanh hơn ~2x)
- **gRPC-node**: Internal communication
- **TypeORM/Prisma**: Database ORM
- **Bull/BullMQ**: Job queue cho async tasks

---

### 2. Data Plane Agent Implementation

**Vai trò**: "Tay chân" - thực thi lệnh từ Control Plane trên từng cluster.

#### Kiến Trúc Agent

```typescript
// File structure
data-plane-agent/
├── src/
│   ├── grpc/
│   │   ├── client.ts           # gRPC client kết nối Control Plane
│   │   └── handlers/
│   │       └── deployment.handler.ts
│   │
│   ├── k8s/                    # Kubernetes operations
│   │   ├── client.ts
│   │   ├── deployment.ts       # Deploy, update, delete
│   │   ├── service.ts
│   │   └── configmap.ts
│   │
│   ├── cache/                  # Local state cache
│   │   └── redis-cache.ts      # Cache deployment states
│   │
│   ├── metrics/                # Metrics reporter
│   │   └── reporter.ts         # Push metrics to Control Plane
│   │
│   └── health/
│       └── check.ts            # Health check endpoint
```

#### Ví Dụ Agent Flow

```typescript
// Agent nhận lệnh từ Control Plane qua gRPC
grpc.DeploymentService.Deploy({
  deploymentId: "dep-456",
  image: "myapp:v1.0",
  replicas: 3,
  namespace: "production"
})

// Agent thực thi:
1. Validate request
2. Check local cache (có deployment này chưa?)
3. Call Kubernetes API:
   - Create/Update Deployment
   - Create/Update Service
   - Create ConfigMap
4. Monitor deployment progress
5. Report status → Control Plane (gRPC streaming)
6. Update local cache
```

#### Deployment Mode

```yaml
# DaemonSet: 1 agent per node (high availability)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: data-plane-agent
spec:
  template:
    spec:
      containers:
      - name: agent
        image: data-plane-agent:v1.0
        env:
        - name: CONTROL_PLANE_URL
          value: "control-plane.default.svc:50051"
```

---

### 3. gRPC Communication Layer

**Tại sao gRPC thay vì HTTP?**

| Feature | HTTP/REST | gRPC |
|---------|-----------|------|
| Protocol | HTTP/1.1 (text) | HTTP/2 (binary) |
| Payload | JSON (~100KB) | Protobuf (~10KB) - 10x nhỏ hơn |
| Latency | ~50ms | ~20ms - 60% nhanh hơn |
| Streaming | Complex (SSE/WebSocket) | Native bi-directional streaming |
| Type Safety | Không có (runtime errors) | Strong typing (compile-time) |

#### Protocol Buffers Definitions

```protobuf
// deployment.proto
syntax = "proto3";

service DeploymentService {
  // Unary call: Deploy một lần
  rpc Deploy(DeployRequest) returns (DeployResponse);
  
  // Server streaming: Stream deployment logs
  rpc StreamLogs(LogRequest) returns (stream LogEntry);
  
  // Bi-directional streaming: Real-time metrics
  rpc StreamMetrics(stream MetricsRequest) returns (stream MetricsResponse);
}

message DeployRequest {
  string deployment_id = 1;
  string image = 2;
  int32 replicas = 3;
  map<string, string> resources = 4;
}

message DeployResponse {
  string status = 1;
  string message = 2;
  int64 timestamp = 3;
}
```

#### TypeScript Generated Code

```typescript
// Auto-generated từ .proto file
import { DeploymentServiceClient } from './generated/deployment_grpc_pb';

// Client usage
const client = new DeploymentServiceClient(
  'control-plane:50051',
  grpc.credentials.createInsecure()
);

// Gọi RPC
client.deploy(request, (error, response) => {
  if (error) {
    console.error('Deploy failed:', error);
  } else {
    console.log('Deploy success:', response.status);
  }
});
```

#### Connection Pooling

```typescript
// connection-pool.ts
class GrpcConnectionPool {
  private pools: Map<string, grpc.Client[]> = new Map();
  
  getConnection(target: string): grpc.Client {
    let pool = this.pools.get(target);
    
    if (!pool) {
      // Tạo pool mới với 10 connections
      pool = Array(10).fill(null).map(() => 
        new DeploymentServiceClient(target, credentials)
      );
      this.pools.set(target, pool);
    }
    
    // Round-robin load balancing
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
```

---

### 4. Centralized State Management

**Vấn đề**: Trong distributed system, ai là "source of truth"?

**Giải pháp**: PostgreSQL làm single source of truth + Redis cache.

#### Database Schema

```sql
-- deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  cluster_id UUID NOT NULL,
  image VARCHAR(255) NOT NULL,
  replicas INT NOT NULL,
  status VARCHAR(50) NOT NULL,  -- pending, running, failed, succeeded
  version INT NOT NULL DEFAULT 1,  -- Optimistic locking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- deployment_events table (Event Sourcing)
CREATE TABLE deployment_events (
  id BIGSERIAL PRIMARY KEY,
  deployment_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,  -- created, updated, deleted
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- distributed_locks table
CREATE TABLE distributed_locks (
  lock_key VARCHAR(255) PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  acquired_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

#### Optimistic Locking Pattern

```typescript
// Tránh race condition khi nhiều services cập nhật cùng lúc
async function updateDeployment(id: string, updates: Partial<Deployment>) {
  const deployment = await repo.findOne(id);
  
  // Check version
  const result = await repo.update({
    id,
    version: deployment.version  // WHERE version = current_version
  }, {
    ...updates,
    version: deployment.version + 1  // Increment version
  });
  
  if (result.affected === 0) {
    throw new Error('Deployment was modified by another process');
  }
}
```

#### State Reconciliation Job

```typescript
// Chạy định kỳ 5 phút để detect drift
async function reconcileState() {
  const deploymentsInDB = await repo.findAll();
  
  for (const deployment of deploymentsInDB) {
    const actualState = await k8sClient.getDeployment(deployment.id);
    
    if (actualState.replicas !== deployment.replicas) {
      console.warn('Drift detected:', {
        expected: deployment.replicas,
        actual: actualState.replicas
      });
      
      // Auto-fix hoặc alert
      await fixDrift(deployment);
    }
  }
}
```

---

## 📊 Success Criteria Giải Thích

### 1. Control Plane API latency < 100ms (p95)
- **p95**: 95% requests phải < 100ms (cho phép 5% outliers)
- **Đo**: Prometheus histogram
- **Tại sao**: User-facing API cần responsive

### 2. gRPC latency reduction ≥ 40% vs HTTP
- **Đo**: A/B testing (cùng workload, compare HTTP vs gRPC)
- **Tại sao**: Justify chi phí migration (viết lại code)

### 3. Zero downtime deployment: 100%
- **Đo**: Rolling update test, monitor request drops
- **Tại sao**: Production reliability - không được downtime

### 4. Database query latency < 50ms (p95)
- **Đo**: `pg_stat_statements` PostgreSQL extension
- **Tại sao**: Backend performance critical

---

## ⚠️ Risks & Mitigation Chi Tiết

### Risk 1: gRPC migration phá vỡ existing clients

**Scenario**: Đang có 10 services call HTTP API, migrate sang gRPC → tất cả break.

**Mitigation**:
```typescript
// Dual support trong transition period
app.use('/api/v1', httpRouter);  // Keep old HTTP API
grpc.server.start();              // New gRPC API

// Gradually migrate clients:
// Week 1-2: Service A, B migrate
// Week 3-4: Service C, D migrate
// Week 5: Deprecate HTTP API
```

### Risk 2: Data Plane agents không reconnect

**Scenario**: Network partition 5 phút → agent mất kết nối → không tự reconnect.

**Mitigation**:
```typescript
// Exponential backoff retry
async function connectWithRetry(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await grpcClient.connect();
      return;
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, i), 30000);  // Max 30s
      await sleep(delay);
    }
  }
  throw new Error('Failed to reconnect after max retries');
}
```

---

## 🎓 Key Takeaways

1. **Control Plane = Quyết định, Data Plane = Thực thi**
2. **gRPC > HTTP cho internal communication** (performance, streaming)
3. **PostgreSQL = Single source of truth** (với optimistic locking)
4. **Gradual migration** (không big bang rewrite)
5. **Always have rollback plan** (dual HTTP/gRPC support)