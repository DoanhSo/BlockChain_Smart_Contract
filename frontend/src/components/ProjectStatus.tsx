export function ProjectStatus() {
  return (
    <section className="roadmap" aria-labelledby="roadmap-title">
      <p className="eyebrow">MỐC PHÁT TRIỂN</p>
      <h2 id="roadmap-title">Từ bộ khung đến cuộc bầu chọn</h2>
      <ol>
        <li><span className="step">01</span><div><h3>Nền tảng dự án</h3><p>Hardhat, Solidity, kiểm thử khởi tạo và frontend React.</p><span className="status">Đã dựng khung</span></div></li>
        <li><span className="step">02</span><div><h3>Quy tắc bỏ phiếu</h3><p>Ứng viên, quyền cử tri, thời gian và kết quả.</p><span className="status muted">Bước tiếp theo</span></div></li>
        <li><span className="step">03</span><div><h3>Demo trên Sepolia</h3><p>Kết nối ví, gửi phiếu và đối chiếu giao dịch.</p><span className="status muted">Chưa triển khai</span></div></li>
      </ol>
    </section>
  )
}
