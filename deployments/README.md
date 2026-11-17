# Thông tin triển khai

## Ethereum Sepolia (chain ID 11155111)

- Hợp đồng `Voting`: `0x3Ae7852FE632DFc7e35D1aA3Df55e10c61931EE7`
- Tiêu đề (constructor): "Bầu lớp trưởng 65CNTT"
- Admin: `0x15c94F15cd2fa70027E1adEB1bAEB0AFcb177678`
- Giao dịch deploy: `0x8fc75557f746474a964355772d7c699ca87c775572c3423f30fd22f52a522ef9`
- Compiler 0.8.34, profile production (optimizer bật, runs 200).
- Source đã verify trên
  [Etherscan](https://sepolia.etherscan.io/address/0x3Ae7852FE632DFc7e35D1aA3Df55e10c61931EE7#code),
  [Blockscout](https://eth-sepolia.blockscout.com/address/0x3Ae7852FE632DFc7e35D1aA3Df55e10c61931EE7#code)
  và Sourcify.
- Metadata đọc lại: `deployments/sepolia.json`; nhật ký Ignition:
  `ignition/deployments/chain-11155111/journal.jsonl`.

Trạng thái lúc ghi: Setup, chưa có ứng viên/cử tri, chưa mở phiếu.

Chỉ công bố metadata, không lưu secret. Deployment local (31337) không được commit.
