# Observability Stack 

## 🎯 MỤC TIÊU TỔNG QUAN

**Bạn cần hiểu:** Observability Stack là hệ thống giúp bạn "nhìn thấy" những gì đang xảy ra bên trong ứng dụng của mình. Giống như việc lắp camera và cảm biến vào nhà để biết ai đang ở đâu, nhiệt độ thế nào, có chuyện gì xảy ra.

**3 thành phần chính:**
1. **Metrics (Prometheus)** - Đo đếm số liệu: như đồng hồ đo tốc độ, nhiệt kế
2. **Logs (Loki)** - Nhật ký sự kiện: như camera ghi hình liên tục
3. **Traces (Tempo)** - Theo dõi hành trình: như GPS theo dõi người đi đâu, làm gì





### Hướng dẫn cài MicroK8s trên Ubuntu (tối ưu cho Observability Stack)

#### 1. Cài đặt
````bash
sudo snap install microk8s --classic
# Thêm user vào group để khỏi dùng sudo
sudo usermod -a -G microk8s $USER
sudo chown -R "$USER":"$USER" ~/.kube || true
newgrp microk8s
````

#### 2. Kiểm tra trạng thái
````bash
microk8s status --wait-ready
microk8s kubectl get nodes
````

#### 3. Bật các add-on cần thiết
````bash
# DNS + storage nội bộ
microk8s enable dns storage

# Ingress (nếu cần expose HTTP services)
microk8s enable ingress

# Metallb (nếu muốn LoadBalancer IP nội bộ)
microk8s enable metallb:192.168.0.200-192.168.0.220   # chỉnh theo dải LAN của bạn

# Observability tiện dụng (tùy chọn, bạn có thể tự deploy stack riêng)
# microk8s enable observability   # (cài prometheus + grafana bản đơn giản)
````

#### 4. Alias kubectl (tùy chọn)
````bash
sudo snap alias microk8s.kubectl kubectl
kubectl get ns
````

#### 5. Tạo namespace observability
````bash
kubectl create namespace observability
kubectl get ns | grep observability
````

#### 6. Kiểm tra CoreDNS & Storage chạy
````bash
kubectl -n kube-system get pods | egrep 'coredns|hostpath|local-storage'
````

#### 7. Mở port cục bộ (port‑forward ví dụ Grafana sau này)
````bash
# Ví dụ (sau khi bạn deploy Grafana vào ns observability)
kubectl -n observability port-forward svc/grafana 3000:80
````

#### 8. Bật Registry nội bộ (nếu cần build & push local)
````bash
microk8s enable registry   # chạy ở localhost:32000
# Tag và push:
docker build -t localhost:32000/project-service:dev .
docker push localhost:32000/project-service:dev
````

#### 9. Xem logs & sự cố nhanh
````bash
kubectl get events -A --sort-by=.lastTimestamp | tail -20
kubectl describe pod <pod> -n <ns>
kubectl logs <pod> -n <ns>
````

#### 10. Nâng cấp / gỡ bỏ
````bash
sudo snap refresh microk8s
sudo snap remove microk8s   # gỡ (xóa toàn bộ data)
````

#### 11. Thêm node (tùy chọn – multi-node lab)
Máy 1:
````bash
microk8s add-node
# copy lệnh join
````
Máy 2:
````bash
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER && newgrp microk8s
<dán lệnh join>
````

#### 12. Soát lỗi thường gặp
- kubectl refused → chưa vào group microk8s hoặc chưa newgrp
- DNS không resolve → kiểm tra coredns pod: `kubectl -n kube-system logs deploy/coredns`
- PVC pending → storage addon chưa enable

#### 13. Bước tiếp theo cho Observability Stack
- Deploy OpenTelemetry Collector (Helm) vào namespace observability
- Triển khai Prometheus Operator (Helm chart kube-prometheus-stack)
- Sau đó Loki + Promtail + Tempo + MinIO

Cần file values mẫu cho Collector hay Prometheus cứ yêu cầu tiếp.