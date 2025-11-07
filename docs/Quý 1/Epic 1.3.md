# Epic 1.3: Observability Stack - Hướng dẫn Chi Tiết Từng Bước

## 🎯 MỤC TIÊU TỔNG QUAN

**Bạn cần hiểu:** Observability Stack là hệ thống giúp bạn "nhìn thấy" những gì đang xảy ra bên trong ứng dụng của mình. Giống như việc lắp camera và cảm biến vào nhà để biết ai đang ở đâu, nhiệt độ thế nào, có chuyện gì xảy ra.

**3 thành phần chính:**
1. **Metrics (Prometheus)** - Đo đếm số liệu: như đồng hồ đo tốc độ, nhiệt kế
2. **Logs (Loki)** - Nhật ký sự kiện: như camera ghi hình liên tục
3. **Traces (Tempo)** - Theo dõi hành trình: như GPS theo dõi người đi đâu, làm gì

**Timeline:** 6 tuần (Tuần 5-10)

---

## 📅 TUẦN 5: Tích hợp OpenTelemetry (Tuần 1/6)

### 🎯 Mục tiêu tuần này
Cài đặt "hệ thống thu thập dữ liệu" để tất cả services có thể gửi thông tin về hoạt động của chúng đến một nơi tập trung.

---

### **NGÀY 1-2: Cài đặt OpenTelemetry Collector**

#### Việc làm 1: Tạo namespace riêng cho observability
**Làm gì:** Tạo một "phòng riêng" trong Kubernetes để chứa tất cả công cụ giám sát.

**Cách làm:**
1. Mở terminal
2. Chạy lệnh: `kubectl create namespace observability`

**Kiểm tra hoàn thành:**
- Chạy `kubectl get namespace` và thấy `observability` trong danh sách

---

#### Việc làm 2: Deploy OpenTelemetry Collector
**Làm gì:** Cài đặt một "bưu điện trung tâm" nhận dữ liệu từ tất cả services và chuyển tiếp đến các nơi cần thiết.

**Cách làm:**
1. Tạo file `otel-collector-values.yaml` với nội dung cấu hình
2. Trong file này, bạn cần định nghĩa:
   - **Receivers:** Nơi nhận dữ liệu (cổng 4317 cho gRPC, 4318 cho HTTP)
   - **Processors:** Xử lý dữ liệu (giới hạn memory, gom nhóm dữ liệu)
   - **Exporters:** Nơi gửi dữ liệu đi (Prometheus, Loki, Tempo)
3. Chạy lệnh Helm để cài đặt
4. Đợi tất cả pods khởi động

**Kiểm tra hoàn thành:**
- Chạy `kubectl get pods -n observability`
- Thấy pod `otel-collector-xxxxx` ở trạng thái `Running`
- Chạy `kubectl logs -n observability otel-collector-xxxxx` không thấy lỗi

---

### **NGÀY 3: Tạo thư viện instrumentation chung**

#### Việc làm 3: Viết code để tự động thu thập dữ liệu
**Làm gì:** Tạo một module JavaScript/TypeScript mà tất cả services sẽ import để tự động ghi lại thông tin về requests, database queries, etc.

**Cách làm:**
1. Tạo thư mục mới: `src/lib/observability/`
2. Tạo file `tracer.ts` 
3. Trong file này viết function `initTracer(serviceName)` với các bước:
   - Khởi tạo OpenTelemetry SDK
   - Cấu hình tên service
   - Cấu hình nơi gửi dữ liệu (URL của OpenTelemetry Collector)
   - Bật auto-instrumentation cho:
     - HTTP requests (tự động ghi lại mọi HTTP call)
     - Express.js (nếu dùng Express)
     - PostgreSQL queries
     - RabbitMQ messages
4. Export function này để các services khác dùng

**Kiểm tra hoàn thành:**
- File `tracer.ts` compile không lỗi
- Có function `initTracer()` có thể import được
- Chạy thử `initTracer('test-service')` không bị crash

---

### **NGÀY 4: Tích hợp vào từng service**

#### Việc làm 4: Thêm instrumentation vào API Gateway
**Làm gì:** Import và gọi function `initTracer()` trong API Gateway để nó bắt đầu gửi dữ liệu.

**Cách làm:**
1. Mở file `services/api-gateway/src/index.ts`
2. Thêm import ở đầu file: `import { initTracer } from '@warpdeploy/observability'`
3. Gọi `initTracer('api-gateway')` **TRƯỚC KHI** khởi tạo Express app
4. Deploy lại API Gateway
5. Kiểm tra logs

**Kiểm tra hoàn thành:**
- API Gateway khởi động không lỗi
- Trong logs thấy dòng "Tracing initialized" hoặc tương tự
- Trong OpenTelemetry Collector logs, thấy dữ liệu từ "api-gateway"

**Lặp lại tương tự cho:**
- Orchestrator Service
- Project Service  
- Webhook Service
- Log Streamer Service

---

### **NGÀY 5: Tạo custom spans cho business logic**

#### Việc làm 5: Thêm spans chi tiết cho các operations quan trọng
**Làm gì:** Ngoài việc tự động ghi HTTP requests, bạn muốn ghi chi tiết hơn như "deployment đang chạy", "build đang diễn ra".

**Cách làm:**
1. Tạo file `src/lib/observability/custom-spans.ts`
2. Viết function `traceDeployment(deploymentId, projectName, fn)`:
   - Tạo một span mới tên "deployment.execute"
   - Thêm attributes: deploymentId, projectName
   - Chạy function `fn()` bên trong span
   - Nếu có lỗi, đánh dấu span là error
   - Kết thúc span
3. Sử dụng trong code deployment:
   ```typescript
   // Thay vì:
   await executeDeployment(deploymentId)
   
   // Dùng:
   await traceDeployment(deploymentId, projectName, () => 
     executeDeployment(deploymentId)
   )
   ```

**Kiểm tra hoàn thành:**
- Khi chạy một deployment, trong Tempo (sau khi setup) thấy span "deployment.execute"
- Span có attributes đầy đủ: deploymentId, projectName
- Nếu deployment fail, span có status ERROR

**Tương tự tạo cho:**
- `traceBuild()` - theo dõi quá trình build
- `traceScaling()` - theo dõi scaling operations

---

### **Tiêu chí hoàn thành Tuần 5:**
✅ OpenTelemetry Collector chạy stable (không restart liên tục)  
✅ API Gateway gửi traces thành công (xem logs collector)  
✅ Orchestrator gửi traces thành công  
✅ Project Service gửi traces thành công  
✅ Webhook Service gửi traces thành công  
✅ Custom spans xuất hiện trong traces  

**Cách verify tổng thể:**
1. Gửi một HTTP request tới API Gateway
2. Check logs của OpenTelemetry Collector
3. Phải thấy trace data được nhận và export

---

## 📅 TUẦN 6: Triển khai Prometheus & Grafana (Tuần 2/6)

### 🎯 Mục tiêu tuần này
Cài đặt Prometheus để thu thập metrics (số liệu), Grafana để xem trực quan, và AlertManager để gửi cảnh báo.

---

### **NGÀY 1-2: Cài đặt Prometheus Operator**

#### Việc làm 1: Deploy Prometheus qua Helm
**Làm gì:** Cài đặt Prometheus - công cụ thu thập và lưu trữ metrics như CPU usage, memory, request count.

**Cách làm:**
1. Tạo file `prometheus-values.yaml` để cấu hình:
   - Lưu trữ 100GB
   - Giữ data trong 30 ngày
   - Tự động tìm các services để scrape metrics
2. Chạy lệnh Helm install
3. Đợi tất cả pods khởi động (có thể mất 5-10 phút)

**Kiểm tra hoàn thành:**
- Chạy `kubectl get pods -n observability | grep prometheus`
- Thấy tất cả pods ở trạng thái `Running`
- Port-forward Prometheus UI: `kubectl port-forward -n observability svc/prometheus 9090:9090`
- Mở browser `http://localhost:9090`
- Thấy Prometheus UI hiển thị

---

#### Việc làm 2: Verify Prometheus đang scrape Kubernetes metrics
**Làm gì:** Kiểm tra Prometheus đã thu thập metrics từ cluster chưa.

**Cách làm:**
1. Mở Prometheus UI (localhost:9090)
2. Click "Status" → "Targets"
3. Xem danh sách targets

**Kiểm tra hoàn thành:**
- Thấy targets từ Kubernetes components (kubelet, kube-state-metrics)
- Tất cả targets có status "UP" (màu xanh)
- Nếu có targets "DOWN" (màu đỏ), cần debug

---

### **NGÀY 3: Tạo ServiceMonitors**

#### Việc làm 3: Tạo ServiceMonitor cho API Gateway
**Làm gì:** Nói với Prometheus "hãy thu thập metrics từ API Gateway".

**Cách làm:**
1. Tạo file `k8s/observability/service-monitors/api-gateway.yaml`
2. Định nghĩa ServiceMonitor với:
   - Tên: `api-gateway`
   - Selector: match label `app: api-gateway`
   - Endpoint: port metrics, path `/metrics`
   - Interval: 15 giây
3. Apply file: `kubectl apply -f api-gateway.yaml`

**Kiểm tra hoàn thành:**
- Chạy `kubectl get servicemonitor -n observability`
- Thấy `api-gateway` trong danh sách
- Trong Prometheus UI → Targets, thấy target mới cho API Gateway
- Target ở trạng thái "UP"

**Lặp lại cho:**
- Orchestrator Service
- Project Service
- RabbitMQ
- PostgreSQL

**Mỗi ServiceMonitor phải:**
- Match đúng service labels
- Point đúng port metrics
- Có trong Prometheus Targets list

---

### **NGÀY 4: Cấu hình Alert Rules**

#### Việc làm 4: Tạo alert cho high error rate
**Làm gì:** Thiết lập cảnh báo khi error rate > 5% trong 5 phút.

**Cách làm:**
1. Tạo file `k8s/observability/alerts/api-alerts.yaml`
2. Định nghĩa PrometheusRule với:
   - Tên alert: `HighErrorRate`
   - Query PromQL: tính tỷ lệ 5xx errors / tổng requests
   - Threshold: > 0.05 (5%)
   - Duration: 5m
   - Labels: severity=critical
   - Annotations: message mô tả
3. Apply file

**Kiểm tra hoàn thành:**
- Trong Prometheus UI → Alerts
- Thấy alert `HighErrorRate` ở trạng thái "Inactive" (xanh lá)
- Để test: cố tình trigger errors để vượt 5%
- Alert chuyển sang "Pending" sau 5 phút
- Alert chuyển sang "Firing" nếu vẫn vượt threshold

**Tạo thêm alerts cho:**
- High latency (p95 > 500ms)
- Pod crashes (restart count tăng)
- High memory (> 80%)
- High disk usage (> 85%)

---

### **NGÀY 5: Deploy Grafana và AlertManager**

#### Việc làm 5: Cài đặt Grafana
**Làm gì:** Cài công cụ để xem charts, graphs từ Prometheus data.

**Cách làm:**
1. Grafana đã được cài cùng Prometheus Operator stack
2. Get password: `kubectl get secret -n observability grafana -o jsonpath="{.data.admin-password}" | base64 -d`
3. Port-forward: `kubectl port-forward -n observability svc/grafana 3000:80`
4. Mở browser `http://localhost:3000`
5. Login với username `admin` và password từ bước 2

**Kiểm tra hoàn thành:**
- Grafana UI hiển thị
- Login thành công
- Vào "Configuration" → "Data Sources"
- Thấy Prometheus data source đã được cấu hình sẵn
- Click "Test" → thấy "Data source is working"

---

#### Việc làm 6: Cấu hình AlertManager
**Làm gì:** Thiết lập gửi alerts đến Slack khi có vấn đề.

**Cách làm:**
1. Tạo Slack webhook URL (trong Slack workspace settings)
2. Update AlertManager config với webhook URL
3. Cấu hình routing rules:
   - Critical alerts → send ngay
   - Warning alerts → group trong 5 phút
4. Apply config

**Kiểm tra hoàn thành:**
- Trigger một test alert
- Trong AlertManager UI thấy alert
- Slack channel nhận được notification
- Notification có đầy đủ thông tin: severity, service name, message

---

### **Tiêu chí hoàn thành Tuần 6:**
✅ Prometheus scrape metrics từ 100% services  
✅ Tất cả ServiceMonitors healthy  
✅ Alert rules loaded vào Prometheus  
✅ Grafana accessible và show data  
✅ AlertManager gửi test alert đến Slack thành công  
✅ Metrics retention = 30 ngày (check config)  

**Cách verify tổng thể:**
1. Prometheus UI → Status → Targets → tất cả UP
2. Grafana → Explore → chọn Prometheus → query `up` → thấy data
3. Trigger error → đợi 5 phút → nhận alert trong Slack

---

## 📅 TUẦN 7-8: Loki Log Aggregation (Tuần 3-4/6)

### 🎯 Mục tiêu 2 tuần này
Thu thập tất cả logs từ mọi pod, lưu trữ tập trung, và có thể search nhanh.

---

### **TUẦN 7 - NGÀY 1-2: Deploy Loki Cluster**

#### Việc làm 1: Setup MinIO (object storage)
**Làm gì:** Cài MinIO để lưu trữ logs (giống như Amazon S3 nhưng tự host).

**Cách làm:**
1. Deploy MinIO qua Helm
2. Tạo buckets:
   - `loki-chunks` - lưu log data
   - `loki-ruler` - lưu alert rules
3. Tạo access key và secret key

**Kiểm tra hoàn thành:**
- MinIO UI accessible (port-forward port 9001)
- Login được vào MinIO console
- Thấy 2 buckets đã tạo

---

#### Việc làm 2: Deploy Loki components
**Làm gì:** Cài Loki - hệ thống thu thập và lưu logs.

**Cách làm:**
1. Tạo `loki-values.yaml` với cấu hình:
   - Storage: point đến MinIO
   - Retention: 7d debug, 30d info, 90d error
   - Components: distributor, ingester, querier, compactor
2. Deploy qua Helm
3. Đợi tất cả pods khởi động

**Kiểm tra hoàn thành:**
- Chạy `kubectl get pods -n observability | grep loki`
- Thấy pods: loki-distributor, loki-ingester, loki-querier, loki-compactor
- Tất cả ở trạng thái `Running`
- Check logs từng pod, không có errors

---

### **TUẦN 7 - NGÀY 3-5: Deploy Promtail và tích hợp Grafana**

#### Việc làm 3: Deploy Promtail
**Làm gì:** Cài Promtail - agent chạy trên mỗi node để đọc logs từ containers và gửi đến Loki.

**Cách làm:**
1. Tạo `promtail-values.yaml`:
   - Client URL: http://loki-gateway:3100/loki/api/v1/push
   - Scrape config: đọc logs từ `/var/log/pods/*`
   - Parsing: JSON format
   - Labels: namespace, pod name, container name
2. Deploy qua Helm dạng DaemonSet (chạy trên mọi node)

**Kiểm tra hoàn thành:**
- `kubectl get pods -n observability | grep promtail`
- Số lượng promtail pods = số lượng nodes
- Tất cả pods Running
- Check logs một promtail pod: `kubectl logs -n observability promtail-xxxxx`
- Thấy messages "successfully sent batch" → đang gửi logs đến Loki

---

#### Việc làm 4: Tích hợp Loki vào Grafana
**Làm gì:** Thêm Loki làm data source trong Grafana để có thể query logs.

**Cách làm:**
1. Vào Grafana UI
2. Configuration → Data Sources → Add data source
3. Chọn "Loki"
4. URL: `http://loki-gateway:3100`
5. Click "Save & Test"

**Kiểm tra hoàn thành:**
- Thấy message "Data source is working"
- Vào Explore tab
- Chọn Loki data source
- Query: `{namespace="default"}`
- Thấy logs hiển thị

---

### **TUẦN 8 - NGÀY 1-3: Structured Logging**

#### Việc làm 5: Chuyển services sang JSON logging
**Làm gì:** Thay vì log dạng text, log dạng JSON để dễ parse và search.

**Ví dụ:**
- **Trước:** `[2024-01-15 10:30:45] INFO: User login failed`
- **Sau:** `{"timestamp":"2024-01-15T10:30:45Z","level":"info","message":"User login failed","user_id":"123","trace_id":"abc"}`

**Cách làm:**
1. Cài thư viện JSON logger (pino cho Node.js)
2. Tạo wrapper logger tại `src/lib/observability/logger.ts`
3. Logger tự động thêm:
   - Standard fields: level, timestamp, message, service name
   - Trace correlation: trace_id, span_id
   - Context: user_id, request_id
4. Thay tất cả `console.log()` bằng logger mới

**Kiểm tra hoàn thành:**
- Deploy service mới
- Check logs: `kubectl logs api-gateway-xxxxx`
- Mọi log line đều là valid JSON
- Parse được JSON: `kubectl logs api-gateway-xxxxx | jq .`
- Thấy trace_id trong logs khi có active trace

**Lặp lại cho tất cả services**

---

### **TUẦN 8 - NGÀY 4-5: Log Queries và Alerts**

#### Việc làm 6: Tạo LogQL query library
**Làm gì:** Viết sẵn các queries thường dùng để debug.

**Tạo file** `docs/logql-queries.md`:

**Query 1: Tìm tất cả errors trong 1 giờ qua**
```logql
{namespace="default"} | json | level="error" | __error__=""
```
**Dùng khi nào:** Muốn xem tất cả errors gần đây

**Query 2: Tìm logs cho một trace cụ thể**
```logql
{namespace="default"} | json | trace_id="abc123xyz"
```
**Dùng khi nào:** Đang debug một request cụ thể, muốn thấy tất cả logs liên quan

**Query 3: Tìm slow requests (>1 giây)**
```logql
{app="api-gateway"} | json | duration > 1000
```
**Dùng khi nào:** Tìm các requests bị chậm

**Kiểm tra hoàn thành:**
- Mở Grafana → Explore → Loki
- Paste từng query
- Tất cả queries đều return kết quả (nếu có data)
- Queries chạy < 2 giây

---

#### Việc làm 7: Tạo Log Volume Dashboard
**Làm gì:** Tạo dashboard Grafana hiển thị log statistics.

**Cách làm:**
1. Grafana → Create → Dashboard → Add Panel
2. **Panel 1: Log volume per service**
   - Query: `sum by(service_name) (rate({namespace="default"}[5m]))`
   - Visualization: Time series
3. **Panel 2: Error rate**
   - Query: `sum(rate({level="error"}[5m]))`
   - Visualization: Graph
4. **Panel 3: Top error messages**
   - Query: `topk(10, sum by(message) (count_over_time({level="error"}[1h])))`
   - Visualization: Table
5. Save dashboard

**Kiểm tra hoàn thành:**
- Dashboard load < 2 giây
- Tất cả panels hiển thị data
- Auto-refresh mỗi 30 giây

---

### **Tiêu chí hoàn thành Tuần 7-8:**
✅ Loki cluster running stable  
✅ Promtail thu thập logs từ 100% pods  
✅ Logs xuất hiện trong Grafana  
✅ 100% services dùng JSON logging  
✅ Có trace_id trong logs  
✅ LogQL queries chạy < 2 giây  
✅ Log Volume Dashboard working  

**Cách verify tổng thể:**
1. Grafana → Explore → Loki → query `{namespace="default"}`
2. Thấy logs từ tất cả services
3. Logs format JSON
4. Search by trace_id → thấy đúng logs

---

## 📅 TUẦN 9: Tempo Distributed Tracing (Tuần 5/6)

### 🎯 Mục tiêu tuần này
Cài Tempo để lưu và search traces, liên kết traces với logs.

---

### **NGÀY 1-2: Deploy Tempo**

#### Việc làm 1: Deploy Tempo cluster
**Làm gì:** Cài Tempo - hệ thống lưu trữ traces.

**Cách làm:**
1. Tạo `tempo-values.yaml`:
   - Storage: dùng MinIO (cùng với Loki)
   - Bucket: `tempo-traces`
   - Retention: 14 ngày
   - Components: distributor, ingester, querier, compactor
2. Tạo bucket trong MinIO
3. Deploy Tempo qua Helm

**Kiểm tra hoàn thành:**
- `kubectl get pods -n observability | grep tempo`
- Thấy: tempo-distributor, tempo-ingester, tempo-querier
- Tất cả Running
- Check MinIO → thấy bucket `tempo-traces` có data

---

### **NGÀY 3: Cấu hình trace ingestion**

#### Việc làm 2: Update OpenTelemetry Collector
**Làm gì:** Nói với Collector "gửi traces đến Tempo".

**Cách làm:**
1. Update `otel-collector-values.yaml`:
   - Thêm exporter: otlp/tempo
   - Endpoint: tempo-distributor:4317
2. Update pipeline: traces → [otlp/tempo]
3. Apply config mới
4. Restart collector pods nếu cần

**Kiểm tra hoàn thành:**
- Generate traffic đến API Gateway
- Check Tempo metrics: `curl http://tempo-query-frontend:3100/metrics | grep tempo_ingester_traces_created_total`
- Thấy counter tăng → traces đang được nhận

---

### **NGÀY 4-5: Tích hợp Grafana và trace search**

#### Việc làm 3: Thêm Tempo vào Grafana
**Làm gì:** Thêm Tempo data source để search traces.

**Cách làm:**
1. Grafana → Configuration → Data Sources → Add
2. Chọn Tempo
3. URL: `http://tempo-query-frontend:3100`
4. Save & Test

**Kiểm tra hoàn thành:**
- Test successful
- Explore → Tempo → Search
- Thấy traces gần đây

---

#### Việc làm 4: Cấu hình trace-to-logs correlation
**Làm gì:** Khi xem trace, có nút click để xem logs liên quan.

**Cách làm:**
1. Trong Tempo data source config
2. Phần "Trace to logs"
3. Data source: Loki
4. Tags: `trace_id`
5. Map tag name: `trace_id`
6. Query: `{namespace="default"} | json | trace_id="${__span.traceId}"`
7. Save

**Kiểm tra hoàn thành:**
- Mở một trace trong Grafana
- Click vào một span
- Thấy button "Logs for this span"
- Click → query Loki với trace_id
- Thấy đúng logs cho trace đó

---

### **Tiêu chí hoàn thành Tuần 9:**
✅ Tempo cluster running  
✅ Traces được ingest ≥1K traces/giây  
✅ 100% errors được sample  
✅ Trace search working trong Grafana  
✅ Trace-to-logs links working  
✅ Trace-to-metrics links working  

**Cách verify:**
1. Generate 1000 requests/giây traffic
2. Grafana → Explore → Tempo → thấy traces
3. Click span → click "Logs" → thấy logs
4. Click span → click "Metrics" → thấy metrics

---

## 📅 TUẦN 10: Dashboards & Finalization (Tuần 6/6)

### 🎯 Mục tiêu tuần này
Tạo dashboards để monitor, viết docs, train team.

---

### **NGÀY 1-2: Tạo System Overview Dashboard**

#### Việc làm 1: Dashboard tổng quan
**Làm gì:** Tạo dashboard "nhìn là biết hệ thống thế nào".

**Các panels cần có:**

**Panel 1: Request Rate**
- Query: `sum(rate(http_requests_total[5m]))`
- Visualization: Graph
- Threshold: màu đỏ nếu < 10 req/s (hệ thống idle)

**Panel 2: Error Rate**
- Query: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
- Visualization: Gauge
- Unit: Percent
- Threshold: 
  - Xanh: 0-1%
  - Vàng: 1-5%
  - Đỏ: >5%

**Panel 3: P95 Latency**
- Query: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- Visualization: Graph
- Unit: seconds
- Threshold: đỏ nếu > 0.5s

**Panel 4: Active Pods**
- Query: `count(kube_pod_info{namespace="default"})`
- Visualization: Stat
- Show current value

**Panel 5: Deployment Frequency**
- Query: `sum(increase(deployment_created_total[1h]))`
- Visualization: Bar gauge
- Show deploys/hour

**Kiểm tra hoàn thành:**
- Dashboard load < 1 giây
- Tất cả panels có data
- Drill-down links work (click graph → detail view)

---

### **NGÀY 3: Service Detail Dashboards**

#### Việc làm 2: Tạo dashboard chi tiết cho API Gateway
**Làm gì:** Dashboard để debug khi API Gateway có vấn đề.

**Các panels:**
1. **Request Rate by Endpoint**
   - Query: `sum by(path) (rate(http_requests_total{service="api-gateway"}[5m]))`
   - Thấy endpoint nào busy nhất

2. **Latency Percentiles**
   - Query p50: `histogram_quantile(0.50, ...)`
   - Query p90: `histogram_quantile(0.90, ...)`
   - Query p95: `histogram_quantile(0.95, ...)`
   - Query p99: `histogram_quantile(0.99, ...)`
   - 4 lines trên cùng graph

3. **Error Rate by Endpoint**
   - Query: `sum by(path) (rate(http_requests_total{status=~"5..",service="api-gateway"}[5m]))`

4. **Resource Usage**
   - CPU: `rate(container_cpu_usage_seconds_total{pod=~"api-gateway.*"}[5m])`
   - Memory: `container_memory_working_set_bytes{pod=~"api-gateway.*"}`

5. **Recent Errors Table**
   - Loki query: `{app="api-gateway",level="error"} | json`
   - Visualization: Logs panel
   - Show last 100 errors
   - Click error → show trace

**Lặp lại cho:** Orchestrator, Project Service, etc.

---

### **NGÀY 4-5: Specialized Dashboards**

#### Việc làm 3: Build Pipeline Dashboard
**Các panels:**
- Build duration histogram
- Build success rate
- Queue length
- Cache hit rate
- Failed builds table (with drill-down to logs)

#### Việc làm 4: Database Dashboard
**Các panels:**
- Query latency percentiles
- Connection pool usage
- Slow queries (> 1 giây)
- Replication lag
- Database size growth

#### Việc làm 5: RabbitMQ Dashboard
**Các panels:**
- Message rate (publish/consume)
- Queue depth per queue
- Consumer lag
- Dead letter queue size
- Connection count

#### Việc làm 6: SLO Tracking Dashboard
**Các panels:**
- Availability SLO (target 99.9%)
- Latency SLO compliance
- Error budget remaining
- SLO burn rate alert

---

### **NGÀY 6-7: Documentation**

#### Việc làm 7: Viết Runbooks

**File 1: `docs/observability/access-guide.md`**
```markdown
# How to Access Observability Tools

## Grafana
1. Run: kubectl port-forward -n observability svc/grafana 3000:80
2. Open: http://localhost:3000
3. Login: admin / [get password command]

## Prometheus
1. Run: kubectl port-forward -n observability svc/prometheus 9090:9090
2. Open: http://localhost:9090

## Common Issues
- "Connection refused" → check pod is running
- "No data" → check ServiceMonitors
```

**File 2: `docs/observability/debug-guide.md`**
```markdown
# How to Debug an Issue

## Step 1: Check System Overview
1. Open System Overview dashboard
2. Is error rate high? → go to Service Detail dashboard
3. Is latency high? → check Database dashboard

## Step 2: Find the root cause service
1. Service Detail dashboard → identify which endpoint is slow
2. Click graph → drill down to traces

## Step 3: Analyze trace
1. Tempo → search by service name and time range
2. Find slow trace → click to expand
3. Identify which span took longest time

## Step 4: Check logs
1. Click span → "Logs for this span"
2. Review logs for errors
3. Check trace_id in logs

## Step 5: Check metrics
1. Click span → "Metrics for this service"
2. Check resource usage during incident
```

**File 3: `docs/observability/alert-response.md`**
```markdown
# Alert Response Procedures

## HighErrorRate Alert
**Severity:** Critical
**Response Time:** 5 minutes

### Steps:
1. Open System Overview dashboard
2. Identify which service has high errors
3. Open Service Detail dashboard for that service
4. Check Recent Errors panel
5. Click error → view trace
6. Follow trace to find root cause

## HighLatency Alert
**Severity:** Warning
**Response Time:** 15 minutes

### Steps:
1. Check if latency is across all endpoints or specific one
2. If specific → might be code issue
3. If all → might be database/infrastructure
4. Check Database dashboard
5. Check for slow queries
```

---

### **NGÀY 8: Training Team**

#### Việc làm 8: Workshops

**Workshop 1: Grafana Basics (1 giờ)**
- How to navigate Grafana
- How to use Explore tab
- How to read dashboards
- How to create simple queries
- **Hands-on:** Mỗi người tự tạo một panel

**Workshop 2: LogQL Queries (1 giờ)**
- LogQL syntax basics
- Common patterns
- How to filter logs
- How to aggregate logs
- **Hands-on:** Viết query tìm errors trong 1 giờ qua

**Workshop 3: Trace Analysis (1 giờ)**
- What is a trace, span?
- How to search traces
- How to interpret trace waterfall
- How to correlate trace → logs → metrics
- **Hands-on:** Debug a slow request using trace

**Workshop 4: Dashboard Interpretation (1 giờ)**
- What each metric means
- How to spot anomalies
- When to escalate
- **Hands-on:** Analyze a dashboard during simulated incident

**Workshop 5: Alert Response (1 giờ)**
- Alert severity levels
- Response procedures
- How to acknowledge alerts
- How to resolve alerts
- **Hands-on:** Role-play on-call scenarios

---

### **NGÀY 9-10: Testing & Finalization**

#### Việc làm 9: Performance Testing

**Test 1: Load test với observability**
```bash
# Generate 1000 req/s for 10 minutes
k6 run --vus 100 --duration 10m load-test.js
```
**Measure:**
- Observability stack CPU usage
- Observability stack memory usage
- Application latency increase
- Prometheus query response time

**Success criteria:**
- CPU < 10% of cluster
- Memory < 15% of cluster
- Latency increase < 5ms
- Query time < 500ms

**Test 2: Trace propagation test**
- Generate request through all 5 services
- Search trace in Tempo
- Verify: 1 trace có 5+ spans (mỗi service 1 span)
- Verify: trace_id giống nhau trong tất cả spans

**Test 3: Log search performance**
- Ingest 1M logs
- Query: `{namespace="default"} | json | level="error"`
- Measure query time
- Success: < 2 giây

**Test 4: Failover test**
- Kill 1 Loki ingester pod
- Verify: logs vẫn được ingest
- Verify: queries vẫn work
- Success: no data loss

---

#### Việc làm 10: Final Checklist

**Functional:**
- [ ] 100% requests có traces
- [ ] Trace context propagates
- [ ] Metrics retention = 30d
- [ ] Log retention policies active
- [ ] Alerts firing correctly
- [ ] All dashboards loading < 1s

**Performance:**
- [ ] Observability CPU < 10%
- [ ] Observability Memory < 15%
- [ ] Trace overhead < 5ms
- [ ] Query time < 500ms

**Operational:**
- [ ] All configs in Git
- [ ] Documentation complete
- [ ] Team trained
- [ ] Runbooks created
- [ ] Backup strategy in place
- [ ] Meta-monitoring setup

---

## ✅ CÁCH KIỂM TRA HOÀN THÀNH TOÀN BỘ EPIC

### Test Scenario: Debug a Slow Request

**Bước 1: Trigger slow request**
```bash
curl http://api-gateway/api/projects
```

**Bước 2: Grafana → System Overview**
- Thấy latency tăng trong graph

**Bước 3: Drill-down → Service Detail Dashboard**
- Identify endpoint `/api/projects` có p95 latency cao

**Bước 4: Grafana → Explore → Tempo**
- Search: service=api-gateway, time=now-5m
- Find trace với duration cao
- Click to expand

**Bước 5: Analyze trace**
- Thấy span nào chiếm thời gian nhiều nhất
- Click span → "Logs for this span"

**Bước 6: Review logs**
- Thấy logs cho span đó
- Có trace_id, có thể search thêm related logs
- Find root cause trong log message

**Bước 7: Check metrics**
- Click span → "Metrics for this service"
- Check CPU/memory during slow request
- Check database metrics

**Success:** Trong 5 phút có thể đi từ "request chậm" → root cause

---

## 🚨 KHI NÀO CẦN HỖ TRỢ

**Escalate ngay nếu:**
- Không thấy traces sau 30 phút deploy OpenTelemetry
- Prometheus không scrape được metrics sau 1 giờ
- Loki không nhận logs sau 1 giờ
- Dashboard không load sau 5 phút
- Storage costs > $200/tháng

**Các vấn đề thường gặp:**

**Problem:** OpenTelemetry Collector không nhận traces
**Debug:**
1. Check collector logs: `kubectl logs otel-collector-xxxxx`
2. Check service có gửi traces không: check service logs
3. Check network: `kubectl exec -it api-gateway-xxxxx -- curl http://otel-collector:4318`

**Problem:** Prometheus không scrape metrics
**Debug:**
1. Check ServiceMonitor exists: `kubectl get servicemonitor`
2. Check service has /metrics endpoint: `curl http://api-gateway:3000/metrics`
3. Check Prometheus logs
4. Check Targets page in Prometheus UI

**Problem:** Grafana dashboard trắng xóa
**Debug:**
1. Check data source connection
2. Check query syntax
3. Check time range (có data trong time range không?)
4. Check pod labels match query

---

Bây giờ bạn đã hiểu rõ từng việc cần làm chưa? Có bước nào còn chưa rõ không?