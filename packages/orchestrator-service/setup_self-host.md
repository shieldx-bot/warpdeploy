# Hướng Dẫn Setup Môi Trường Cho Hệ Thống WarpDeploy  


## Giới Thiệu: 
**Warpdeploy** là một nền tảng Platform as a Service (PaaS) mã nguồn mở, cho phép bạn triển khai ứng dụng từ mã nguồn Git lên Kubernetes một cách hoàn toàn tự động. Dự án này là một minh chứng thực tế về việc xây dựng một hệ thống cloud-native phức tạp dựa trên kiến trúc microservices.

Mục tiêu của Warpdeploy không chỉ là tạo ra một công cụ, mà còn là một hành trình khám phá và làm chủ các công nghệ nền tảng của điện toán đám mây hiện đại.


-----

## ✨ Tính năng nổi bật (Key Features) (DEMO)

  * **Luồng làm việc Git-Driven:** Chỉ cần `git push` và Warpdeploy sẽ lo phần còn lại.
  * **Tự động Build:** Tự động phát hiện ngôn ngữ và build mã nguồn thành Docker image bằng Cloud Native Buildpacks mà không cần `Dockerfile`.
  * **Triển khai trên Kubernetes:** Tự động hóa việc tạo `Deployment`, `Service`, và `Ingress` để đưa ứng dụng của bạn ra thế giới.
  * **Kiến trúc Microservices:** Toàn bộ nền tảng được xây dựng từ các dịch vụ nhỏ, độc lập, có khả năng mở rộng cao.
  * **Log thời gian thực:** Theo dõi log build và log ứng dụng trực tiếp từ giao diện web.
  * **Giao diện trực quan:** Bảng điều khiển (Dashboard) được xây dựng bằng React để quản lý và giám sát các dự án của bạn.

-----
# Các Bước Setup Môi Trường 

## Chuẩn bị: 2 VPS Server Lunix/Ubuntu + Tài Khoản Github + Docker Hub

### 1, VPS Thứ Nhất Phụ : Git Clone Mã Nguồn + Tạo Image bằng thư viện (buildpacks-cli) +  để đẩy lên Docker 
 Nên Cấu Hình  (1 RAM + 1CPU) Là Đủ , Cấu hình thấp như thế bởi vì là đang giả lập cơ chế của github action, (Github action của github thường ta sẽ dùng cơ chế tạo server tạm thời để tạo build và cấu hình ) nhưng điều đó lại  đánh vào điểm cốt yếu của hệ thống là cần một hệ thống có thể tự quản lý , chi phí rẻ, và hiệu suất cao. 
``` bash 
Lý do : tôi chọn việc tự cấu hình hệ thống theo cách này là vì hiệu suất deploy của nó rất tốt thời gian deploy sẽ nhanh hơn vì chỉ cần setup thư viện một lần duy nhất mấy lần sau chỉ cần lướt qua mà không tốn
quá nhiều thời gian, vẫn giữ cơ chế,  xóa mã nguồn sau khi git clone, và xóa các Image  và container sau khi  đã đẩy image lên Docker Hub 
```


### 2, VPS Thứ Hai Chính: Lưu trữ toàn bộ hệ thống mã nguồn đã chuyển thành container của khách hàng deploy lêm

Nên Cấu Hình ( 4 RAM + 8 CPU )  Trở Lên, SSD cũng rất quan tâm, nó sẽ quyết định hệ thống của bạn có thể chứa được bao nhiêu container của khách hàng



## Hướng Dẫn Cài Đặt Runner Trên VPS Phụ
### Bước 1: Bước Đầu Tải Mã Nguồn Về Rồi Đẩy Lên Github Của Bạn

### Bước 2: Setup Runner Trên VPS
Truy cập vào github vừa đẩy mã nguồn của warmdeploy 
Đi tới phần Settings > Actions > Runners > New self-hosted runner
Chọn hệ điều hành Linux và kiến trúc x64 (64-bit)
Sao chép lệnh tải xuống và giải nén runner. 
Ví dụ:

> Các Đoạn Mã Này Phải Thực Thi Trên VPS Mà Bạn Muốn Cấu Hình Runner
###  Chỉ Là Demo Hãy Vào Phần Runner Của Github Để Lấy Các Câu Lệnh Thực Sự Của Bạn, Không Nên Sử Dụng Các Câu Lệnh Dưới Mà Tôi Cung Cấp
``` bash 
$ mkdir actions-runner && cd actions-runner
 # Download the latest runner package

 ```
``` bash 
$ curl -o actions-runner-linux-x64-2.329.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.329.0/actions-runner-linux-x64-2.329.0.tar.gz 
# Optional: Validate the hash
```


``` bash 

$ echo "194f1e1e4bd02f80b7e96sc928a324d512ea53430102e1d  actions-runner-linux-x64-2.329.0.tar.gz" | shasum -a 256 -c# Extract the installer

```

``` bash 
$ tar xzf ./actions-runner-linux-x64-2.329.0.tar.gz

```

``` bash
Xong  Truy Cập Vào Setting Github Action Kiểm tra xem coi vps của bạn đã trỏ về chưa hiện trạng thái 'IDE' là đã hoàn tất, còn việc hiện trạng thái off thì bạn hãy kiểm tra: VPS có hoạt động hay không? , Đã cấu hình đúng như hướng dẫn và github hay chưa. 

```







### Lựa chọn 2: Chạy như một dịch vụ (Khuyên dùng ✅)
Đây là cách đúng đắn để runner của bạn luôn hoạt động, kể cả khi bạn đã đóng terminal hay khởi động lại máy chủ.

Cài đặt dịch vụ: Chạy lệnh sau để đăng ký runner như một dịch vụ hệ thống. Bạn cần quyền sudo.

Bash

sudo ./svc.sh install
Khởi động dịch vụ: Bây giờ, hãy khởi động nó.

Bash

sudo ./svc.sh start
(Tùy chọn) Kiểm tra trạng thái: Bạn có thể kiểm tra xem dịch vụ có đang chạy hay không.

Bash

sudo ./svc.sh status
Nếu thành công, bạn sẽ thấy dòng chữ active (running).