# Kiểm tra bộ khung ngày 29/10/2026

## Phạm vi đã kiểm tra

- `npm run check`: thành công, gồm compile Solidity, typecheck Hardhat,
  test, lint frontend, xuất ABI và build frontend.
- `npm run test:production`: thành công với profile compiler có optimizer.
- 4 unit test Solidity: admin/tiêu đề đúng, tiêu đề rỗng, biên 160 byte,
  tiêu đề vượt 160 byte.
- 1 integration test TypeScript: triển khai module Ignition vào mạng mô phỏng,
  đọc lại tiêu đề tiếng Việt và admin qua viem.
- Frontend dev mở được ở `http://127.0.0.1:5173`; khi chưa cấu hình địa chỉ,
  hiển thị đúng thông báo và vô hiệu hóa nút đọc. Kiểm tra console trình duyệt
  lúc mở không ghi nhận error/warn.

Tổng: 5 test, không có test nghiệp vụ bỏ phiếu vì nghiệp vụ chưa được cài đặt.
Chưa triển khai Sepolia, chưa kiểm thử kết nối ví hay giao dịch bỏ phiếu.

## Cảnh báo còn tồn tại

`npm audit` báo 12 mục mức high liên quan cùng dependency Zod 3.25.76 và chuỗi
Hardhat; `npm audit --omit=dev` còn 1 mục Zod do peer tùy chọn của abitype được
dùng chung trong workspace. Không diễn giải đây là 12 lỗi độc lập của Solidity
hoặc đã chứng minh bị khai thác trong giao diện.

Nguồn: [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
Bản vá được công bố là Zod 4.6.6, trong khi Hardhat hiện yêu cầu Zod ^3.23.8.
Không ép đổi major của Zod hoặc dùng `npm audit fix --force` để hạ Hardhat 3 xuống
Hardhat 2. Theo dõi bản vá tương thích và kiểm tra lại dependencies trước mốc
triển khai; cảnh báo này chưa được xử lý trong bộ khung.

Build Vite thành công nhưng cảnh báo externalize `node:worker_threads` từ
dependency `ox/tempo`. Luồng dev đọc trang ban đầu không có lỗi console;
chưa kiểm thử các tính năng Tempo (dự án không dùng chúng).
