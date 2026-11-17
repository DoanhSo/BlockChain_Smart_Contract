# CSE465 · Voting System

Bộ khung bài tập lớn đề P: Solidity, Hardhat 3 và frontend React/TypeScript.
Thư mục dự án: `C:\Users\mrdoanh\Downloads\BlockChain`.

## Trạng thái

Hợp đồng `Voting` đã có quản lý ứng viên, đăng ký cử tri theo batch, mở phiếu có
thời hạn, bỏ phiếu một lần mỗi ví và kết quả thắng/hòa/không phiếu; 51 test đạt
trên mạng local. Frontend có màn hình quản trị, bỏ phiếu và kết quả nhưng **chưa
được kiểm thử với ví thật**. **Chưa triển khai lên Sepolia.**

## Môi trường

- Node.js 24.15.0 (ghi trong `.nvmrc`) và npm 11.
- Solidity compiler 0.8.34, ghim trong code và Hardhat config.
- Hardhat 3 + viem + Ignition; React + TypeScript + Vite.
- Một npm workspace ở gốc quản lý cả contracts và `frontend`, một `package-lock.json`.

Lần cài đầu cần Internet để tải npm packages và compiler. Trong PowerShell:

```powershell
Set-Location C:\Users\mrdoanh\Downloads\BlockChain
npm ci
npm run check
npm run dev
```

Frontend mở tại http://127.0.0.1:5173. Nếu chưa có địa chỉ hợp đồng, trang hiển thị
“Chưa cấu hình”, không tạo kết quả hoặc địa chỉ demo giả. Nhấn Ctrl+C để dừng server.
Nếu checkout mới chưa có `node_modules`, dùng `npm ci` ở gốc; không cần cài riêng frontend.

## Cấu trúc

```text
contracts/Voting.sol             Hợp đồng bầu chọn
test/Voting.t.sol                Unit test Solidity cho constructor
test/VotingSetup.t.sol           Unit test ứng viên, cử tri, mở phiếu
test/VotingBallot.t.sol          Unit test bỏ phiếu, thời hạn, kết quả, fuzz
test/Voting.ts                   Integration test deployment module + viem
ignition/modules/Voting.ts       Deployment module có tham số title
scripts/export-abi.ts            Xuất ABI từ artifact đã compile
scripts/demo-local.ts            Demo local thắng/hòa/không phiếu và đo gas
scripts/seed-election.ts         Thêm dữ liệu thử vào deployment local
scripts/export-deployment.ts     Ghi metadata deployment cho frontend
scripts/smoke-sepolia.ts         Kiểm tra chỉ đọc deployment Sepolia
frontend/src/components/         Thành phần giao diện
frontend/src/lib/blockchain.ts   Cấu hình RPC, mạng và địa chỉ hợp đồng
frontend/src/generated/voting.ts ABI được sinh tự động
deployments/                    Hướng dẫn metadata triển khai
docs/                           Yêu cầu, kế hoạch, demo, báo cáo và minh chứng
hardhat.config.ts               Compiler, local, Sepolia và verify
```

## Lệnh chính

- `npm run compile`: compile Solidity.
- `npm run typecheck`: compile rồi kiểm tra TypeScript phía Hardhat.
- `npm test`: unit test Solidity và integration test TypeScript.
- `npm run test:production`: test với build profile dùng khi deploy.
- `npm run lint`: kiểm tra frontend bằng Oxlint.
- `npm run build`: xuất ABI, typecheck và build frontend.
- `npm run check`: typecheck, test, lint và build.
- `npm run node`: khởi động Hardhat local tại 127.0.0.1:8545, chain ID 31337.
- `npm run deploy:local`: triển khai lên node local đang chạy.
- `npm run seed:local`: thêm 3 ứng viên, 5 ví cử tri vào deployment local (không mở phiếu).
- `npm run export:local` / `npm run export:sepolia`: ghi metadata deployment.
- `npm run demo:local`: chạy demo đầy đủ trên mạng mô phỏng, ghi `docs/evidence/local-demo.json`.
- `npm run smoke:sepolia`: đọc và đối chiếu deployment Sepolia (cần `SEPOLIA_RPC_URL`).
- `npm run export:abi`: compile khi cần và cập nhật ABI cho frontend.
- `npm run dev`: xuất ABI rồi chạy Vite.

ABI được xuất từ compiler, không sửa bằng tay. Sau khi thay đổi contract, chạy
`npm run export:abi`; frontend build/dev ở gốc đã bao gồm bước này.

## Chạy đầy đủ với blockchain local

Terminal 1, tại thư mục gốc:

```powershell
npm run node
```

Terminal 2:

```powershell
npm run deploy:local
Copy-Item frontend/.env.example frontend/.env.local
```

Chỉ copy nếu chưa có file `.env.local` cần giữ. Điền địa chỉ `VotingModule#Voting`
thật từ output hoặc `ignition/deployments/chain-31337/deployed_addresses.json`
vào `VITE_VOTING_ADDRESS` trong `frontend/.env.local`. Giữ chain ID 31337 và RPC local.
Sau đó chạy `npm run dev`, mở trang và bấm **Đọc thông tin hợp đồng**.
Thao tác này chỉ đọc state, không yêu cầu ví ký giao dịch.

Nếu khởi động lại node làm mất state, journal Ignition cũ có thể không còn khớp.
Với **mạng local dùng thử**, chạy `npm run deploy:local -- --reset` rồi cập nhật địa chỉ.
Không áp dụng reset cho deployment testnet cần lưu minh chứng. Tài khoản do Hardhat
tạo là tài khoản công khai để phát triển, không sử dụng để giữ tài sản thật.

## Chuẩn bị Sepolia ở mốc sau

Hoàn thiện nghiệp vụ và kiểm thử trước khi tạo bản dùng để nộp. Khi sẵn sàng,
copy `.env.example` sang `.env`, điền `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`
của ví thử nghiệm và `ETHERSCAN_API_KEY` nếu verify. Cấu hình tự đọc `.env`;
local compile/test không cần các biến này.

```powershell
npm run deploy:sepolia
npm run verify:sepolia
```

Các lệnh này gửi giao dịch hoặc xác minh bản triển khai thật khi được chạy; **chưa
được chạy trong mốc dựng khung**. Wallet deploy phải có Sepolia ETH. Metadata của
Ignition ở `ignition/deployments/chain-11155111/`. Kiểm tra receipt, bytecode và
constructor arguments; verify source không thay thế kiểm thử.

Frontend Sepolia cần `VITE_CHAIN_ID=11155111`, `VITE_RPC_URL` công khai phù hợp và
`VITE_VOTING_ADDRESS` đúng deployment. Mọi biến `VITE_*` đều có thể xuất hiện trong
bundle trình duyệt: tuyệt đối không đặt private key/seed phrase trong đó.
Sau khi sửa biến frontend, khởi động lại dev server hoặc build lại.

## Công việc tiếp theo

Theo dõi đầu việc, thứ tự phụ thuộc và tiêu chí nghiệm thu trong
[kế hoạch thực hiện M1–M6](docs/IMPLEMENTATION-PLAN.md).

1. ~~Ứng viên và cấp quyền cử tri, kiểm thử quyền admin.~~ (đã xong)
2. ~~Vòng đời Setup/Voting/Ended, thời hạn và chống bỏ trùng.~~ (đã xong)
3. ~~Kết quả thắng/hòa/không phiếu và các bất biến số đếm.~~ (đã xong)
4. Kiểm thử frontend với ví MetaMask, sửa cảnh báo lint.
5. Deploy Sepolia, minh chứng, báo cáo và bảo vệ.

Đọc [yêu cầu](docs/requirements.md), [kế hoạch chi tiết](docs/KE-HOACH-DE-P-SOLIDITY.md)
và [kịch bản demo](docs/demo-script.md).

## Kết quả kiểm tra

Ngày 17/11/2026: `npm test` và `npm run test:production` đạt 51 test,
`npm run demo:local` đạt. Chi tiết, số đo gas và cảnh báo còn tồn tại trong
[kết quả kiểm tra](docs/test-results.md). Tất cả là kết quả local, chưa có Sepolia.
