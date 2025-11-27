# Hướng Dẫn Build Services  API-GATEWAY

## 1. Cho Production (Hiệu suất cao, Kích thước nhỏ)

### Build Image

``` bash
# Đặt tên image là 'my-app' với tag 'latest'
docker build -t my-app:latest .

```


### Chạy Image:

``` bash 
docker run -d -p 3003:3003 --name my-prod-app my-app:latest

```



## 2. Cho Development (Hot-Reloading)

### Build Image (Chỉ 1 lần):

```bash
# Chúng ta "nhắm" tới stage 'development'
# Đặt tên image là 'my-app-dev'
docker build --target development -t my-app-dev .

```

### Chạy Image (Sử dụng Volume): Đây là lệnh quan trọng. Chúng ta sẽ "mount" (gắn) code từ máy thật của bạn vào bên trong container.

```bash 

# -v .:/app: Gắn thư mục hiện tại (máy host) vào thư mục /app (container)
# -v /app/node_modules: "Trick" để giữ lại node_modules trong image
# --rm: Tự động xóa container khi dừng
docker run -it --rm -p 3003:3003 \
  -v .:/app \
  -v /app/node_modules \
  --name my-dev-container \
  my-app-dev


```

