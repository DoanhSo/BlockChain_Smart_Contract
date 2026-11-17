# Kết quả kiểm tra ngày 17/11/2026

Môi trường: Windows 11, Node.js 24.15.0, Solidity 0.8.34, Hardhat 3.
Toàn bộ kết quả dưới đây chạy trên **mạng mô phỏng local (chain 31337)**,
không phải Sepolia. Chưa triển khai Sepolia, chưa thử frontend với ví MetaMask.

## Lệnh đã chạy

- `npm test`: 51 test đạt (50 Solidity, 1 TypeScript).
- `npm run test:production`: 51 test đạt với profile optimizer (runs 200).
- `npm run typecheck`: đạt.
- `npm run build`: đạt (có cảnh báo, xem bên dưới).
- `npm run lint`: đạt với 3 cảnh báo React trong frontend, chưa sửa.
- `npm run demo:local`: đạt; ghi `docs/evidence/local-demo.json`.

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

- Lint frontend: `useWallet.ts` gọi setState đồng bộ trong effect và đọc
  `ref.current` trong cleanup; `App.tsx` gọi `Date.now()` khi render.
- Build Vite: bundle khoảng 517 kB (vượt ngưỡng cảnh báo 500 kB); cảnh báo
  externalize `node:worker_threads` từ `ox/tempo` (dự án không dùng Tempo).
- `npm audit` (ghi nhận từ lúc tạo khung, chưa kiểm tra lại): các mục high liên
  quan Zod 3.25.76 trong chuỗi Hardhat
  ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)).
  Hardhat yêu cầu Zod ^3.23.8 nên không ép nâng major hoặc `npm audit fix --force`.
