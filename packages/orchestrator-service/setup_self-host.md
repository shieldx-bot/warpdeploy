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