# Thông tin triển khai

## Ethereum Sepolia (chain ID 11155111), bản dùng chính thức

- Hợp đồng `Voting`: `0xfdDf72319CF2B1F63680c8cd3E678c4dA4fdf910`
- Tiêu đề (constructor): "Bầu lớp trưởng 65CNTT"
- Admin: `0x15c94F15cd2fa70027E1adEB1bAEB0AFcb177678`
- Giao dịch deploy: `0x2b280b4fb0e2d6132a02addbcee9f57d3676deeb8ec33bef3ce39866dd90a912`
- Compiler 0.8.34, profile production (optimizer bật, runs 200).
- Source đã verify trên
  [Etherscan](https://sepolia.etherscan.io/address/0xfdDf72319CF2B1F63680c8cd3E678c4dA4fdf910#code),
  [Blockscout](https://eth-sepolia.blockscout.com/address/0xfdDf72319CF2B1F63680c8cd3E678c4dA4fdf910#code)
  và [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0xfdDf72319CF2B1F63680c8cd3E678c4dA4fdf910).
- Metadata đọc lại: `deployments/sepolia.json`; nhật ký Ignition:
  `ignition/deployments/chain-11155111/journal.jsonl`.

### Cấu hình bằng `npm run setup:sepolia` (đọc `deployments/sepolia-election.json`)

| Thao tác | Giao dịch |
|---|---|
| Thêm "Nguyễn Văn Séc" | `0x7ee5bbb6524c10baf2887af51ff9f637afbcf3b49df06c0136a8d57677b35cf6` |
| Thêm "Nguyễn Tiến Lộc" | `0x055eecd951b40241913be1b42dab5bb085eef45cf7cbf08f7026ec0dc9896208` |
| Thêm "Nguyễn Thái Dương" | `0xba0874caf66ac97f1f10cbda7227667b4272a95cc30e4e15b874440eac5c2e4f` |
| Thêm "Nguyễn Văn Quyền" | `0xb596ab584db995f59452f92a7a663bcc348baedabf4268777c06dadb64f15ce4` |
| Đăng ký 4 cử tri (577.177 gas) | `0x21ae4d11ac1cda5c675711c777a0c1bd071dd3d614472ec7abe3574d3c664ae2` |

Trạng thái lúc ghi: Setup, 4 ứng viên, 4 cử tri, **chưa mở phiếu**. Admin mở phiếu
từ giao diện khi các ví cử tri sẵn sàng; thời lượng dự kiến 20 phút.

`sourceDirty: true` trong `sepolia.json` chỉ do nhật ký Ignition mới chưa commit
lúc xuất; mã nguồn contract là commit `sourceCommit`.

## Bản Sepolia đầu tiên (đã thay thế)

`0x3Ae7852FE632DFc7e35D1aA3Df55e10c61931EE7`: trong lúc thử thủ công có thêm
một ứng viên ngoài kế hoạch, mà contract không cho xóa ứng viên, nên triển khai lại.
Giữ hồ sơ tại `ignition/deployments/sepolia-v1-superseded/` và
`deployments/sepolia-v1-superseded.json`. Không dùng bản này làm minh chứng kết quả.

Chỉ công bố metadata, không lưu secret. Deployment local (31337) không được commit.
