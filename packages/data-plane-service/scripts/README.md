# MicroK8s Observability Stack Setup

Công cụ tự động cài đặt và cấu hình MicroK8s với full Observability Stack (Prometheus, Grafana, Loki) trên Ubuntu.

## 🎯 Tính năng

- ✅ Cài đặt MicroK8s tự động
- ✅ Bật DNS, Storage, RBAC
- ✅ Triển khai Prometheus Operator
- ✅ Cài đặt Grafana với dashboard mẫu
- ✅ Cấu hình Loki cho log aggregation
- ✅ Ingress controller (optional)
- ✅ Output terminal đẹp với màu sắc và ký hiệu Unicode
- ✅ Logging chi tiết vào `/var/log/microk8s-setup.log`
- ✅ Tự động tạo kubectl alias
- ✅ Hiển thị thông tin Grafana access

## 📋 Yêu cầu

- Ubuntu 20.04+ (khuyến nghị 22.04)
- Sudo access
- Tối thiểu 2GB RAM
- Kết nối internet

## 🚀 Cách sử dụng

### 1. Chạy trực tiếp trên máy local

```bash
# Cấp quyền thực thi
chmod +x setup-microk8s-observability.sh

# Chạy script
./setup-microk8s-observability.sh
```

### 2. Chạy qua SSH (remote)

```bash
# Copy và chạy script trên remote host
ssh user@remote-host 'bash -s' < setup-microk8s-observability.sh

# Hoặc sử dụng scp
scp setup-microk8s-observability.sh user@remote-host:/tmp/
ssh user@remote-host 'bash /tmp/setup-microk8s-observability.sh'
```

### 3. Tích hợp vào Dockerfile

```dockerfile
FROM ubuntu:22.04

# Copy setup script
COPY setup-microk8s-observability.sh /scripts/

# Run setup
RUN /scripts/setup-microk8s-observability.sh

# ... rest of Dockerfile
```

### 4. Sử dụng API REST (từ data-plane-service)

#### Setup MicroK8s trên remote host:

```bash
curl -X POST http://localhost:8080/setup-microk8s \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "username": "ubuntu",
    "password": "your-password"
  }'
```

Hoặc dùng SSH key:

```bash
curl -X POST http://localhost:8080/setup-microk8s \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "username": "ubuntu",
    "privateKeyPath": "/home/user/.ssh/id_rsa"
  }'
```

#### Kiểm tra trạng thái MicroK8s:

```bash
curl -X POST http://localhost:8080/microk8s-status \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "username": "ubuntu",
    "password": "your-password"
  }'
```

#### Lấy thông tin Grafana:

```bash
curl -X POST http://localhost:8080/grafana-info \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "username": "ubuntu",
    "password": "your-password"
  }'
```

### 5. Sử dụng TypeScript module

```typescript
import { 
  setupMicroK8sRemote, 
  checkMicroK8sStatus, 
  getGrafanaInfo 
} from './k8s/jobs/worker/setup-microk8s';

// Setup MicroK8s
const result = await setupMicroK8sRemote({
  host: '192.168.1.100',
  username: 'ubuntu',
  password: 'your-password',
  // hoặc: privateKeyPath: '/path/to/key'
});

console.log(result.status); // 'success' or 'error'
console.log(result.output);

// Check status
const status = await checkMicroK8sStatus({
  host: '192.168.1.100',
  username: 'ubuntu',
  password: 'your-password'
});

// Get Grafana info
const grafana = await getGrafanaInfo({
  host: '192.168.1.100',
  username: 'ubuntu',
  password: 'your-password'
});
```

## 📊 Sau khi cài đặt

### Truy cập Grafana

```bash
# Port-forward Grafana service
microk8s kubectl -n observability port-forward svc/grafana 3000:80

# Mở browser: http://localhost:3000
# Username: admin
# Password: (xem trong output script hoặc chạy)
microk8s kubectl get secret -n observability grafana \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo
```

### Kiểm tra pods

```bash
# Xem tất cả pods
microk8s kubectl get pods -A

# Pods trong observability namespace
microk8s kubectl get pods -n observability

# Xem logs
microk8s kubectl logs -n observability <pod-name>
```

### Xem services

```bash
# Services trong observability namespace
microk8s kubectl get svc -n observability

# Endpoints
microk8s kubectl get endpoints -n observability
```

## 🔧 Troubleshooting

### Script fails với permission denied

```bash
# Đảm bảo user trong group microk8s
sudo usermod -a -G microk8s $USER
newgrp microk8s
```

### Pods pending hoặc không start

```bash
# Kiểm tra events
microk8s kubectl get events -n observability --sort-by='.lastTimestamp'

# Describe pod để xem lỗi
microk8s kubectl describe pod <pod-name> -n observability
```

### Không thể kết nối kubectl

```bash
# Export kubeconfig
mkdir -p ~/.kube
microk8s config > ~/.kube/config

# Kiểm tra
kubectl get nodes
```

### Log file

```bash
# Xem log chi tiết
tail -f /var/log/microk8s-setup.log
```

## 🎨 Output mẫu

```
╔════════════════════════════════════════════════════════════════╗
║ 🚀 MicroK8s Observability Stack Setup v1.0.0
╚════════════════════════════════════════════════════════════════╝

ℹ Checking internet connectivity...
✓ Internet connection verified

➜ Installing system dependencies...
✓ System dependencies installed

➜ Installing MicroK8s 1.28/stable...
✓ MicroK8s 1.28/stable installed successfully

➜ Configuring user permissions...
✓ User permissions configured

➜ Waiting for MicroK8s to be ready...
✓ MicroK8s is ready

➜ Enabling core MicroK8s addons...
✓ dns enabled
✓ hostpath-storage enabled
✓ rbac enabled

➜ 📊 Enabling Observability Stack (Prometheus, Grafana, Loki)...
✓ Observability stack enabled successfully

╔════════════════════════════════════════════════════════════════╗
║ Grafana Access Information
╠════════════════════════════════════════════════════════════════╣
║ Service: grafana
║ Username: admin
║ Password: AbCd1234XyZ
║
║ To access Grafana:
║ microk8s kubectl -n observability port-forward svc/grafana 3000:80
║ http://localhost:3000
╚════════════════════════════════════════════════════════════════╝

✓ Installation Complete!
```

## 📚 Tài liệu thêm

- [MicroK8s Documentation](https://microk8s.io/docs)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)

## 🤝 Đóng góp

Nếu gặp vấn đề hoặc có đề xuất cải tiến, vui lòng tạo issue hoặc PR.

## 📝 License

MIT License - ShieldX Platform Team
