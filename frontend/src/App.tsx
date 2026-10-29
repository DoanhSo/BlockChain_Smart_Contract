import { useState } from 'react'
import { ProjectStatus } from './components/ProjectStatus'
import { client, contractAddress, configurationError, chain } from './lib/blockchain'
import { votingAbi } from './generated/voting'
import './App.css'

export default function App() {
  const [metadata, setMetadata] = useState<{ title: string; admin: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function readMetadata() {
    if (!client || !contractAddress) return
    setBusy(true)
    setError('')
    setMetadata(null)
    try {
      if (await client.getChainId() !== chain.id) {
        throw new Error('RPC không thuộc mạng đã cấu hình.')
      }
      const code = await client.getCode({ address: contractAddress })
      if (!code || code === '0x') throw new Error('Không có hợp đồng tại địa chỉ này trên mạng đã chọn.')
      const [title, admin] = await Promise.all([
        client.readContract({ address: contractAddress, abi: votingAbi, functionName: 'electionTitle' }),
        client.readContract({ address: contractAddress, abi: votingAbi, functionName: 'admin' }),
      ])
      setMetadata({ title, admin })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không đọc được hợp đồng. Kiểm tra RPC và địa chỉ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="workspace">
      <header className="topbar"><span>CSE465 / ĐỀ P</span><span className="badge">Khung dự án</span></header>
      <section className="intro">
        <p className="eyebrow">HỆ THỐNG BẦU CHỌN TRÊN BLOCKCHAIN</p>
        <h1>Mỗi phiếu bầu.<br />Một bản ghi có thể kiểm chứng.</h1>
        <p className="lead">Nền tảng cho bài tập lớn Solidity: hợp đồng, kiểm thử và triển khai trên Ethereum Sepolia.</p>
      </section>
      <div className="columns">
        <section className="connection" aria-labelledby="connection-title">
          <h2 id="connection-title">Kết nối hợp đồng</h2>
          <dl>
            <div><dt>Mạng cấu hình</dt><dd>{chain.name} · {chain.id}</dd></div>
            <div><dt>Địa chỉ</dt><dd className="address">{contractAddress ?? 'Chưa cấu hình'}</dd></div>
          </dl>
          <p className="hint">{contractAddress ? 'Đọc dữ liệu từ RPC để kiểm tra bản triển khai.' : 'Sau khi triển khai, đặt VITE_VOTING_ADDRESS trong frontend/.env.local và khởi động lại frontend.'}</p>
          {configurationError && <p role="alert" className="error">{configurationError}</p>}
          <button disabled={!contractAddress || !client || busy} onClick={() => void readMetadata()}>
            {busy ? 'Đang đọc…' : 'Đọc thông tin hợp đồng'}
          </button>
          <div aria-live="polite">
            {metadata && <dl className="metadata"><div><dt>Cuộc bầu chọn</dt><dd>{metadata.title}</dd></div><div><dt>Quản trị viên</dt><dd className="address">{metadata.admin}</dd></div></dl>}
          </div>
          {error && <p role="alert" className="error">{error}</p>}
        </section>
        <ProjectStatus />
      </div>
      <footer>Phiếu công khai · Một ví được cấp quyền, một phiếu · Nghiệp vụ bỏ phiếu đang chờ triển khai</footer>
    </main>
  )
}
