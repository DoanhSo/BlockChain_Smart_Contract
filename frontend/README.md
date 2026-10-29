# Frontend CSE465

React + TypeScript + Vite + viem. Chạy các lệnh từ thư mục gốc:

```powershell
npm ci
npm run dev
```

Trang ban đầu trình bày trạng thái dự án. Khi cấu hình địa chỉ hợp đồng thật,
nút đọc thông tin gọi `electionTitle()` và `admin()` qua RPC. Chưa có kết nối ví
hoặc thao tác bỏ phiếu trong bộ khung này.

- `src/components`: các thành phần giao diện.
- `src/lib/blockchain.ts`: kiểm tra chain ID/address và tạo public client.
- `src/generated/voting.ts`: ABI tự động từ `npm run export:abi`.
- `.env.example`: mẫu cấu hình, copy sang `.env.local` rồi cập nhật deployment.

Không đưa secret vào biến `VITE_*`. Xem README gốc để chạy node/deploy local và
chuẩn bị Sepolia. `npm run build` ở gốc sẽ xuất ABI và build frontend.
