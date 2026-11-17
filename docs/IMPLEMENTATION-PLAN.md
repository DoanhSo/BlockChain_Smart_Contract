# Kế hoạch thực hiện từ bộ khung đến bản nộp đề P

Ngày lập: 29/10/2026. Mốc mã nguồn đối chiếu: `6234443` trên nhánh `main`.
Trạng thái: kế hoạch thực hiện; các checkbox chưa đánh dấu là công việc chưa hoàn thành.

Tài liệu này chia công việc thành các phần có thể giao và nghiệm thu. Quy tắc nghiệp vụ
chi tiết nằm trong [phân tích đề P](KE-HOACH-DE-P-SOLIDITY.md) và
[yêu cầu](requirements.md). Nếu thay đổi quy tắc, cập nhật cả đặc tả và kiểm thử.

## 1. Điểm xuất phát và mục tiêu

### Đã có ở bộ khung

- [x] Repository GitHub, npm workspace, Hardhat 3 và frontend React/TypeScript.
- [x] Compiler Solidity 0.8.34, cấu hình local và Sepolia.
- [x] `Voting.sol` khởi tạo admin và tiêu đề, kiểm tra giới hạn tiêu đề.
- [x] Module Ignition, script xuất ABI và frontend đọc metadata khi có địa chỉ.
- [x] Kết quả kiểm tra đã ghi nhận: 4 unit test Solidity, 1 integration test;
  compile/typecheck/lint/build và test với production profile đạt.

Đây là kết quả ở mốc bộ khung, không phải test nghiệp vụ bỏ phiếu hoặc triển khai Sepolia.

### Bản hoàn chỉnh cần đạt

Admin chuẩn bị ứng viên và cử tri, mở cuộc bầu chọn; cử tri được cấp quyền bỏ đúng
một phiếu; sau hạn có kết quả thắng, hòa hoặc không có phiếu. Các quy tắc được kiểm
tra trong contract. Giao diện ký giao dịch qua ví và đọc kết quả từ chain. Có một
phiên chạy thật trên Ethereum Sepolia, bộ kiểm thử tái lập, minh chứng và báo cáo.

Ưu tiên P0: contract, test, triển khai Sepolia và báo cáo đúng đề.
Ưu tiên P1: giao diện đầy đủ luồng, xác minh source, tự động hóa thao tác local/CI.
Chỉ làm chức năng mở rộng sau khi P0 và luồng demo chính đã đạt.

## 2. Các quyết định giữ cố định trong bản đầu

- Một deployment cho một cuộc bầu chọn; không reset hay nâng cấp proxy.
- Admin cố định là địa chỉ deploy, không mặc nhiên có quyền bỏ phiếu.
- Phiếu công khai; một ví đăng ký có một phiếu, trọng số 1.
- Setup → Voting → Ended; thời gian đọc từ block, hết hạn không cần giao dịch đóng.
- Danh sách và thời hạn khóa sau khi bắt đầu; không gia hạn, đổi phiếu hoặc đóng sớm.
- Ít nhất 2 ứng viên, ít nhất 1 cử tri trước khi mở.
- Giới hạn thiết kế ban đầu: 20 ứng viên, tên 1–96 byte UTF-8,
  batch đăng ký 1–100 địa chỉ, thời lượng 60 giây–30 ngày.
- Trùng tên được kiểm tra theo byte; frontend chuẩn hóa khoảng trắng/Unicode.
- Batch có một địa chỉ không hợp lệ phải revert toàn bộ, không ghi nhận một phần.
- Kết quả tạm thời công khai; kết quả cuối phân biệt Winner, Tie và NoVotes.
- Không thêm token, delegation, backend lưu phiếu hoặc cơ chế phiếu kín vào MVP.

Các giới hạn số lượng/batch cần được đo gas trước khi chốt deployment cuối.
Nếu không đạt giới hạn gas thực tế, giảm batch rồi cập nhật đặc tả và test.

## 3. Giai đoạn M1 — Danh sách và quyền quản trị

Ưu tiên P0. Ước lượng 2 ngày làm việc của nhóm. Chủ trì A, người kiểm tra B.
Phụ thuộc: bộ khung hiện tại.

### Công việc

- [ ] M1.1. Thêm `Candidate`, mảng ứng viên, mapping tên đã dùng,
  `isRegistered`, `hasVoted`, `registeredVoterCount`, `totalVotes`.
- [ ] M1.2. Thêm `Phase`, cờ `started`, thời gian bắt đầu/kết thúc và `phase()`;
  định nghĩa rõ trạng thái Setup trước khi có thao tác mở ở M2.
- [ ] M1.3. Viết kiểm tra `onlyAdmin`, `onlySetup` và custom errors.
- [ ] M1.4. Viết `addCandidate`, `candidateCount`, `getCandidate`;
  kiểm tra tên, trùng tên, giới hạn và ID; phát `CandidateAdded`.
- [ ] M1.5. Viết `registerVoters` theo batch; kiểm tra địa chỉ 0, trùng trong batch,
  trùng đã đăng ký, kích thước batch; phát `VoterRegistered`.
- [ ] M1.6. Viết test quyền admin, dữ liệu đầu vào, giới hạn, getter,
  event và tính nguyên tử khi batch thất bại.

Tệp chính: `contracts/Voting.sol`, `test/Voting.t.sol`; có thể tách thêm test theo
nhóm nghiệp vụ khi suite lớn. Giữ constructor hiện tại để module triển khai tiếp tục chạy.

### Điều kiện qua mốc

Chỉ admin sửa được danh sách ở Setup; mỗi địa chỉ chỉ được tính một lần trong
`registeredVoterCount`; batch lỗi không để lại state. Getter và event đối chiếu
được với dữ liệu đã thêm. `npm run check` đạt. Kiểm tra khóa danh sách sau mở
được hoàn tất khi M2 cung cấp chuyển trạng thái thật.

## 4. Giai đoạn M2 — Vòng đời, bỏ phiếu và kết quả

Ưu tiên P0. Ước lượng 3 ngày. Chủ trì A, B kiểm tra. Phụ thuộc: M1.

### Công việc

- [ ] M2.1. `startVoting(durationSeconds)`: chỉ admin, mở một lần, kiểm tra điều
  kiện tối thiểu, lưu thời gian và phát `VotingStarted`.
- [ ] M2.2. Kiểm tra trạng thái cho mọi thao tác ghi; khóa danh sách sau khi mở.
- [ ] M2.3. `vote(candidateId)`: kiểm tra thời gian, quyền cử tri, phiếu trùng,
  ID; cập nhật `hasVoted`, số phiếu ứng viên và tổng; phát `VoteCast`.
- [ ] M2.4. `getResults()`: số phiếu hiện tại và tổng, đọc được ở mọi giai đoạn.
- [ ] M2.5. `getOutcome()`: chỉ sau Ended, trả NoVotes hoặc toàn bộ ID đồng hạng
  cao nhất; phân biệt một người thắng với hòa.
- [ ] M2.6. Test sai trạng thái, mở lại, thời lượng ngoài giới hạn, admin chưa
  đăng ký, bỏ trùng, ID sai và dữ liệu không đổi sau revert.
- [ ] M2.7. Test thắng duy nhất, hòa hai/nhiều ứng viên, không phiếu và đọc
  kết quả cuối trước hạn.
- [ ] M2.8. Xuất lại ABI, ghi danh sách function/event/error cho frontend.

### Điều kiện qua mốc

Một chu trình từ Setup đến Ended chạy được bằng test. Đúng `endTime` phải chặn
phiếu mới. Không có hàm sửa hoặc reset số đếm. Hai lần bỏ phiếu của cùng ví chỉ
có tối đa một lần thành công. `npm run check` và `npm run test:production` đạt.

Sau mốc này, giữ ổn định API để triển khai frontend. Mọi thay đổi ABI sau đó phải
cập nhật script xuất ABI, UI, tests và deployment liên quan trong cùng phần việc.

## 5. Giai đoạn M3 — Kiểm thử sâu và demo local tái lập

Ưu tiên P0; CI là P1. Ước lượng 3 ngày. Chủ trì B, D tích hợp. Phụ thuộc: M2.

### Công việc

- [ ] M3.1. Kiểm thử timestamp tại block mở, `endTime - 1`, `endTime`,
  `endTime + 1`; dùng clock/block của mạng local, không chờ thời gian thật.
- [ ] M3.2. Fuzz hoặc chuỗi hành động với mô hình đếm độc lập: tổng phiếu ứng
  viên bằng `totalVotes`, tổng không vượt số ví đăng ký, mỗi ví tối đa một phiếu.
- [ ] M3.3. Chứng minh trạng thái bỏ phiếu không thay đổi sau Ended, kể cả admin.
- [ ] M3.4. Viết `scripts/seed-election.ts`: thêm dữ liệu thử trên chain 31337,
  kiểm tra quyền và trạng thái, từ chối chạy nhầm chain. Mặc định không tự mở phiếu.
- [ ] M3.5. Viết script demo local: 3 ứng viên, 5 ví hợp lệ và 1 ví không được
  cấp quyền; luồng hợp lệ và các trường hợp bị từ chối.
- [ ] M3.6. Xuất deployment metadata cho frontend: chain ID, địa chỉ, tên
  contract; kiểm tra bytecode trước khi ghi. Không tạo địa chỉ giả khi chưa deploy.
- [ ] M3.7. Đo gas deploy, thêm ứng viên, đăng ký batch 1/10/50 ví và bỏ phiếu;
  ghi compiler/profile và số liệu thực tế.
- [ ] M3.8. Tạo CI GitHub Actions chạy `npm ci`, `npm run check`,
  `npm run test:production`; không dùng secret và không deploy trong CI kiểm tra.
- [ ] M3.9. Rà lại dependency Zod và cảnh báo build `ox/tempo` đã ghi trong
  `test-results.md`; thử bản sửa tương thích nếu có, không ép đổi major mù quáng.

### Điều kiện qua mốc

Một thành viên khác làm theo README trên môi trường mới có thể install, chạy test,
deploy local và tái hiện kết quả. Có số gas đo được và danh sách cảnh báo còn tồn tại.
Test không phụ thuộc thứ tự chạy; dữ liệu cuộc bỏ phiếu trước không rò sang fixture sau.

Phân biệt test hợp đồng với test script: unit test Solidity cho luật, TypeScript
cho triển khai và luồng nhiều tài khoản. Không xem số lượng test/coverage là bằng
chứng đủ nếu còn thiếu các nhánh quyền và thời gian.

## 6. Giai đoạn M4 — Giao diện quản trị, cử tri và kết quả

Ưu tiên P1. Ước lượng 5 ngày. Chủ trì C, A/B hỗ trợ tích hợp.
Phụ thuộc: ABI M2; dùng deployment và dữ liệu M3 để nghiệm thu. Có thể chuẩn bị
bố cục từ sớm, nhưng không dùng dữ liệu giả làm bằng chứng tích hợp.

### Công việc

- [ ] M4.1. Tách lớp kết nối ví khỏi public client hiện tại: kết nối MetaMask,
  đọc account/chain, đăng ký và hủy listener khi đổi tài khoản hoặc mạng.
- [ ] M4.2. Xác thực network, contract address và bytecode trước khi tương tác;
  hiển thị sai mạng, chưa deploy, mất RPC và chưa kết nối ví rõ ràng.
- [ ] M4.3. Tạo luồng giao dịch chung: kiểm tra đầu vào → mô phỏng → yêu cầu ký
  → hiển thị hash → chờ receipt → kiểm tra status → đọc lại state.
- [ ] M4.4. Màn hình admin: thêm ứng viên, nhập batch ví, số cử tri, thời lượng,
  bắt đầu; các thao tác chỉ khả dụng trong trạng thái phù hợp.
- [ ] M4.5. Màn hình cử tri: thông tin cuộc bầu chọn, ứng viên, quyền của ví,
  đã bỏ hay chưa, chọn ứng viên và xác nhận bỏ phiếu.
- [ ] M4.6. Màn hình kết quả: số phiếu, tổng, nhãn tạm thời/cuối cùng,
  tất cả người đồng hạng hoặc không có phiếu; liên kết explorer đúng mạng.
- [ ] M4.7. Cập nhật theo block/poll; bộ đếm thời gian chỉ hỗ trợ hiển thị,
  đọc `phase()` làm căn cứ nghiệp vụ. Hủy dữ liệu cũ khi đổi ví/mạng.
- [ ] M4.8. Ánh xạ custom errors sang tiếng Việt; xử lý hủy ký, thiếu gas,
  RPC lỗi, giao dịch revert, pending và giao dịch thay thế/hủy.
- [ ] M4.9. Kiểm tra giao diện hẹp, keyboard focus, nhãn trường và thông báo
  trạng thái; kiểm tra cả production preview, không chỉ dev server.

Tệp dự kiến: `frontend/src/lib/wallet.ts`, `frontend/src/lib/voting.ts`,
`frontend/src/hooks/`, các component admin/vote/results và `App.tsx`.
Tên/tách file có thể điều chỉnh theo thực tế, tránh gom toàn bộ luồng vào App.

### Điều kiện qua mốc

Admin chuẩn bị và mở phiếu; nhiều ví bỏ phiếu và xem kết quả từ UI local.
Refresh trang vẫn thấy dữ liệu đúng. UI không báo thành công chỉ vì nhận hash.
Một ví không được cấp quyền bị contract chặn cả khi gọi trực tiếp, không chỉ do
UI ẩn nút. Không đưa private key vào frontend hoặc yêu cầu người dùng nhập nó.

## 7. Giai đoạn M5 — Triển khai và nghiệm thu Ethereum Sepolia

Ưu tiên P0. Ước lượng 3 ngày, gồm thời gian dự phòng mạng/faucet. Chủ trì D.
Phụ thuộc: M3 đạt; luồng giao diện M4 đạt để demo đầy đủ.

### Chuẩn bị có thể làm sớm

- [ ] Chuẩn bị ví testnet riêng, RPC và Sepolia ETH cho admin lẫn ví cử tri.
- [ ] Kiểm tra chain ID `11155111`, quyền truy cập explorer/API verify.
- [ ] Ghi nhận deadline nộp và thời lượng bảo vệ khi có thông báo.

Chỉ cần địa chỉ ví công khai để lập danh sách cử tri. Khóa ký được giữ trong ví
hoặc môi trường secret local; không gửi seed phrase qua chat hay commit vào repo.

### Công việc sau khi bản local đạt

- [ ] M5.1. Chọn commit để triển khai, chạy lại kiểm tra cần thiết và khóa
  compiler, optimizer, EVM target, constructor arguments.
- [ ] M5.2. Xem lại cảnh báo dependency/build còn tồn tại, ghi phạm vi ảnh hưởng
  và cách xử lý; không gọi bản demo là đã được kiểm toán bảo mật.
- [ ] M5.3. Deploy bằng Ignition, xác nhận receipt thành công và có bytecode.
- [ ] M5.4. Verify source với cùng cấu hình build; lưu kết quả thực tế.
- [ ] M5.5. Lưu metadata vào `deployments/sepolia.json` và hồ sơ Ignition:
  địa chỉ, chain ID, tx hash, block, commit và constructor arguments.
- [ ] M5.6. Cấp quyền/ứng viên, kiểm tra lại dữ liệu trước khi mở; chạy một
  phiên thật với ít nhất 3 ví cử tri và 2 ứng viên để minh họa thắng duy nhất.
- [ ] M5.7. Cập nhật frontend đúng ABI/address; đọc kết quả từ UI và explorer,
  lưu ảnh/receipt trong `docs/evidence/`.
- [ ] M5.8. Viết `smoke-sepolia.ts` đọc và kiểm tra metadata/state dự kiến;
  không tự gửi phiếu bằng ví người dùng trong một lệnh kiểm tra chỉ đọc.

### Điều kiện qua mốc

Có deployment thật trên đúng Sepolia và chu trình bỏ phiếu có receipt/state
đối chiếu được. Có kết quả cuối sau hạn. Hòa/không phiếu có thể chứng minh bằng
test local hoặc cuộc bầu chọn riêng, ghi đúng nguồn dữ liệu. UI và báo cáo dùng
cùng địa chỉ/commit; nếu redeploy phải cập nhật toàn bộ và giữ dấu vết bản cũ.

Thiếu RPC, ví ký hoặc ETH chỉ chặn bước phát giao dịch tương ứng; các phần code,
test, UI và báo cáo có thể tiếp tục độc lập. Không thay Sepolia bằng local rồi
đánh dấu yêu cầu triển khai testnet đã hoàn thành.

## 8. Giai đoạn M6 — Báo cáo, đóng gói và bảo vệ

Ưu tiên P0. Ước lượng 4 ngày. Cả nhóm, D tổng hợp. Phụ thuộc: số liệu cuối từ M5;
các phần đặt vấn đề/lý thuyết/thiết kế có thể viết từ M1.

- [ ] M6.1. Hoàn thiện báo cáo đúng bốn phần, tổng không quá 40 trang;
  ưu tiên giải thích code chính, test và kết quả thật.
- [ ] M6.2. Đồng bộ sơ đồ kiến trúc/vòng đời với implementation cuối;
  trích nguồn tài liệu và công khai giới hạn danh tính, quyền riêng tư, quản trị.
- [ ] M6.3. Chuẩn bị demo 8–10 phút hoặc theo thời lượng giảng viên giao;
  ví, ứng viên, thời hạn và trình tự thao tác đã diễn tập.
- [ ] M6.4. Lưu video/ảnh dự phòng có ghi đúng nguồn khi RPC/mạng chậm.
- [ ] M6.5. Mỗi người giải thích được `vote`, `phase`, `getOutcome`, gas,
  receipt, giới hạn một ví/một người và vai trò admin.
- [ ] M6.6. Kiểm tra README từ checkout mới, dependency lock, metadata,
  minh chứng và các tệp cần nộp; không có secret hoặc node_modules trong commit.
- [ ] M6.7. Đóng băng phiên bản nộp, ghi commit cuối và in báo cáo.

Điều kiện hoàn thành: người khác có thể chạy lại project; demo và báo cáo khớp
bản nộp; mọi thành viên trình bày được phần cốt lõi, không chỉ phần được phân công.

## 9. Lịch và trách nhiệm

Giả định nhóm 4 người, khoảng 4 tuần còn lại. Đây là lịch tương đối, không phải
deadline của học phần. Ước lượng ngày theo nhịp làm việc của nhóm, không phải mỗi
người phải dành đủ 8 giờ mỗi ngày.

- **Tuần 1:** M1 trong ngày 1–2; M2 trong ngày 3–5. C chuẩn bị bố cục UI,
  D chuẩn bị hạ tầng testnet và khung báo cáo.
- **Tuần 2:** M3 trong ngày 6–8; M4 bắt đầu ngày 9–10. B tiếp tục kiểm tra
  các bất biến và đối chiếu script với contract.
- **Tuần 3:** hoàn tất M4 ngày 11–13; M5 bắt đầu ngày 14–15.
- **Tuần 4:** hoàn tất M5 ngày 16; M6 trong ngày 17–20, có thời gian dự phòng
  trong công việc hoàn thiện/diễn tập để xử lý lỗi cuối.

Trách nhiệm chính: A hợp đồng, B kiểm thử và gas, C frontend, D triển khai/CI/tài liệu.
Mỗi người viết phần báo cáo của mình và kiểm tra chéo phần khác. Phân công này là
đề xuất cho thành viên nhóm, không có nghĩa đã tạo agent hoặc giao việc bên ngoài.

Nếu thời gian ít hơn: giữ M1/M2/M3, triển khai Sepolia và báo cáo; thu gọn UI thành
một trang, dùng explorer cho một số thao tác quản trị. Cắt trang trí và mở rộng,
không cắt kiểm tra quyền, phiếu trùng, thời gian và minh chứng testnet.

## 10. Cách quản lý tiến độ trong repository

- Mỗi phần việc có commit riêng: setup/danh sách, vòng đời/vote, kết quả,
  kiểm thử/local scripts, ví, admin UI, voter/results UI, Sepolia, tài liệu.
- Khi cần nhánh tính năng, dùng tên theo phạm vi như `feat/voting-setup`,
  `feat/voting-lifecycle`, `feat/voting-results`, `feat/wallet-ui`.
- Không gộp cập nhật dependencies lớn với thay đổi nghiệp vụ nếu không cần thiết.
- Trước khi kết thúc mốc: kiểm tra diff, chạy kiểm tra phù hợp, cập nhật ABI và
  README nếu hành vi thay đổi, ghi kết quả thật vào `docs/test-results.md`.
- Trước bản triển khai cuối: chạy `npm run check` và `npm run test:production`
  trên cùng commit; các bước trước không cần lặp toàn bộ test nếu chỉ sửa tài liệu.
- Chỉ đánh dấu checkbox khi có code/tài liệu/minh chứng tương ứng. Mốc nào thiếu
  điều kiện nghiệm thu thì vẫn chưa hoàn thành dù giao diện đã hiển thị nút.

Kế hoạch này chưa tạo GitHub issue, nhánh hay commit triển khai mới.

## 11. Phần việc nên bắt đầu ngay ở lượt triển khai tiếp theo

**M1: quyền quản trị, ứng viên và cử tri.** Giữ nguyên constructor, thêm dữ liệu
và các hàm Setup, viết test cho quyền/đầu vào/batch rồi chạy kiểm tra. Đây là nền
tảng để thêm vòng đời và bỏ phiếu ở M2 mà không phải đổi lại mô hình dữ liệu.

Đầu ra cụ thể của phần việc đầu: `Voting.sol` quản lý được danh sách trong Setup,
bộ test mới, ABI cập nhật và trạng thái tiến độ được ghi đúng trong README.
