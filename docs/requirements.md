# Phạm vi đề P

Nguồn và thiết kế đầy đủ: [Kế hoạch Solidity](./KE-HOACH-DE-P-SOLIDITY.md).

## Yêu cầu học phần

- Hợp đồng thông minh voting system, triển khai Ethereum Sepolia.
- Báo cáo bốn phần, tối đa 40 trang, nộp bản cứng.
- Phân công nhóm và chuẩn bị bảo vệ cá nhân.

## Quy tắc thiết kế đã chọn

- Một hợp đồng cho mỗi cuộc bầu chọn, phiếu công khai.
- Admin thêm ứng viên, đăng ký cử tri trong Setup; chỉ mở một lần.
- Danh sách và thời hạn cố định sau khi mở.
- Mỗi ví được cấp quyền có một phiếu, trọng số 1.
- Phiếu chỉ hợp lệ khi startTime <= block.timestamp < endTime.
- Kết quả cuối phân biệt thắng duy nhất, hòa và không có phiếu.
- Blockchain không tự xác thực một ví tương ứng một người.

## Mốc triển khai tiếp theo

- [x] Quản lý ứng viên và đăng ký cử tri, kèm test phân quyền.
- [x] Mở phiếu, thời gian, chống bỏ trùng và kiểm thử biên.
- [x] Kiểm phiếu và outcome, test hòa/không phiếu/bất biến.
- [x] Kết nối ví và tương tác hợp đồng trên frontend (thử local; MetaMask thật khi chạy Sepolia).
- [ ] Triển khai, verify, thu minh chứng Sepolia.
- [ ] Báo cáo và diễn tập bảo vệ.

Ba mốc đầu đã có code và test local ([kết quả](./test-results.md)).
Đã triển khai và verify trên Sepolia (`deployments/README.md`); chưa chạy phiên bỏ phiếu thật.
