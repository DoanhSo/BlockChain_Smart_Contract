# Kết quả kiểm tra ngày 17/11/2026

Môi trường: Windows 11, Node.js 24.15.0, Solidity 0.8.34, Hardhat 3.
Toàn bộ kết quả dưới đây chạy trên **mạng mô phỏng local (chain 31337)**,
không phải Sepolia. Chưa triển khai Sepolia, chưa thử frontend với ví MetaMask.
Giao diện đã được thử bằng ví thử nghiệm trên node local (mục bên dưới).

## Lệnh đã chạy

- `npm test`: 51 test đạt (50 Solidity, 1 TypeScript).
- `npm run test:production`: 51 test đạt với profile optimizer (runs 200).
- `npm run typecheck`: đạt.
- `npm run build`: đạt (có cảnh báo, xem bên dưới).
- `npm run lint`: đạt, không còn cảnh báo.
- `npm run demo:local`: đạt; ghi `docs/evidence/local-demo.json`.

## Kiểm thử giao diện trên node local

Chạy `npm run node`, `deploy:local`, `seed:local`, `export:local`, `npm run dev`.
Trình duyệt dùng một ví thử nghiệm gắn vào `window.ethereum`, chuyển tiếp tới các
tài khoản mở khóa của Hardhat node; **chưa thử bằng extension MetaMask thật**.

- Admin: thêm ứng viên "  Dũng   Trần " được chuẩn hóa thành "Dũng Trần";
  thêm trùng "An" bị chặn ở bước mô phỏng với thông báo "Tên ứng viên đã tồn tại."
  (không gửi giao dịch); đăng ký thêm 1 ví; mở phiếu 2 phút; bảng quản trị ẩn sau khi mở.
- Cử tri: 3 ví bỏ phiếu (An, An, Dũng Trần), mỗi giao dịch hiện hash và
  "Giao dịch thành công trong block"; ví đã bỏ phiếu và ví chưa được cấp quyền
  không chọn được ứng viên; ví hợp lệ chưa bỏ phiếu thì chọn được.
- Kết quả: sau hạn và có block mới, hiển thị "Kết quả cuối cùng — Người thắng: An";
  tải lại trang vẫn đọc đúng kết quả từ chain. Không có lỗi console.
  Bề rộng 375 px không bị cuộn ngang.

Lỗi tìm thấy và đã sửa: bộ đếm ngược tính theo timestamp block mới nhất nên bị
đứng khi không có block mới (node local chỉ đào block khi có giao dịch) và sai
lệch tối đa một block trên Sepolia. Nay đếm theo đồng hồ máy; trạng thái bỏ phiếu
vẫn lấy từ `phase()` trên chain. Trên node local, `phase()` chỉ chuyển sang
"Đã kết thúc" khi có block mới sau hạn (giao dịch bất kỳ hoặc `evm_mine`).

## Phạm vi test

- `test/Voting.t.sol` (4): admin, tiêu đề, biên độ dài tiêu đề.
- `test/VotingSetup.t.sol`: quyền admin, tên ứng viên (rỗng, biên 96 byte,
  trùng, giới hạn 20), đăng ký batch (địa chỉ 0, trùng trong batch/đã đăng ký,
  giới hạn 100, rollback toàn batch), điều kiện và thời lượng `startVoting`,
  khóa danh sách sau khi mở.
- `test/VotingBallot.t.sol`: bỏ phiếu tại `startTime`, `endTime - 1`, đúng
  `endTime` và sau hạn; ví chưa đăng ký; bỏ trùng/đổi phiếu; ID sai không tiêu
  phiếu; admin không tự có quyền; thắng duy nhất, hòa 2 và 3 ứng viên, không có
  phiếu; `getOutcome` trước khi kết thúc; không nhận ETH; fuzz chuỗi thao tác
  (256 lần) giữ tổng phiếu bằng `totalVotes` và mỗi ví tối đa một phiếu.
- `test/Voting.ts` (1): triển khai module Ignition và đọc lại qua viem.

`demo:local` chạy 3 cuộc bầu chọn (thắng, hòa, không phiếu) với 3 ứng viên,
5 ví hợp lệ, 1 ví không được cấp quyền; xác nhận các lỗi `NotRegistered`,
`AlreadyVoted`, `InvalidPhase` và kết quả cuối khớp dự kiến.

## Gas đo được (profile production, local)

| Thao tác | Gas |
|---|---|
| Deploy `Voting` | 1.052.353 – 1.052.413 (phụ thuộc độ dài tiêu đề) |
| `addCandidate` | 79.071 – 96.159 |
| `registerVoters` 1 ví | 70.249 |
| `registerVoters` 5 ví | 167.265 |
| `registerVoters` 10 ví | 285.997 |
| `registerVoters` 50 ví | 1.244.877 |
| `startVoting` | 93.806 |
| `vote` | 64.400 – 98.600 (phiếu đầu cho ứng viên/tổng tốn hơn) |

Batch 50 ví khoảng 1,25 triệu gas; ngoại suy batch tối đa 100 ví khoảng 2,5 triệu,
thấp hơn nhiều so với giới hạn gas của một block, nên giữ `MAX_BATCH_SIZE = 100`.
Chi phí trên Sepolia phụ thuộc giá gas lúc gửi; đo lại khi triển khai thật.

## Cảnh báo còn tồn tại

- Build Vite: bundle khoảng 517 kB (vượt ngưỡng cảnh báo 500 kB); cảnh báo
  externalize `node:worker_threads` từ `ox/tempo` (dự án không dùng Tempo).
- `npm audit` (ghi nhận từ lúc tạo khung, chưa kiểm tra lại): các mục high liên
  quan Zod 3.25.76 trong chuỗi Hardhat
  ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)).
  Hardhat yêu cầu Zod ^3.23.8 nên không ép nâng major hoặc `npm audit fix --force`.
