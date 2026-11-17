import { useEffect, useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { BallotPanel } from './components/BallotPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { useWallet } from './hooks/useWallet'
import { useElection } from './hooks/useElection'
import { useTransaction } from './hooks/useTransaction'
import { chain, contractAddress, configurationError } from './lib/blockchain'
import type { VotingAction } from './lib/transactions'
import './App.css'

const phases = ['Chuẩn bị', 'Đang bỏ phiếu', 'Đã kết thúc']
function short(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}` }
function time(seconds: bigint) { return seconds ? new Date(Number(seconds) * 1000).toLocaleString('vi-VN', { timeZoneName: 'short' }) : 'Chưa bắt đầu' }

export default function App() {
  const wallet = useWallet()
  const election = useElection(wallet.account)
  const tx = useTransaction(election.refresh)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1_000); return () => clearInterval(timer) }, [])
  const data = election.data
  const stale = !data || now - data.fetchedAt > 20_000
  // Display only: phase() read from the chain stays the authority on whether voting is open.
  const remaining = data?.phase === 1 ? Math.max(0, Number(data.endTime) - Math.floor(now / 1000)) : 0
  const blocked = tx.busy || stale || wallet.wrongNetwork || !wallet.account
  const admin = data && wallet.account?.toLowerCase() === data.admin.toLowerCase()
  const explorer = chain.blockExplorers?.default.url
  async function execute(action: VotingAction, label: string) {
    if (blocked) return false
    return tx.execute(wallet.provider, wallet.account, action, label)
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <span>CSE465 / ĐỀ P</span>
        <div className="wallet-bar"><span className="badge">{chain.id === 31337 ? 'Mạng local' : 'Sepolia testnet'}</span>
          <button className="secondary" onClick={() => void wallet.connect()} disabled={wallet.connecting}>{wallet.connecting ? 'Đang kết nối…' : wallet.account ? short(wallet.account) : 'Kết nối ví'}</button>
        </div>
      </header>
      <section className="intro">
        <p className="eyebrow">BẦU CHỌN MINH BẠCH</p>
        <h1>{data?.title ?? 'Mỗi phiếu bầu.\nMột lựa chọn có trách nhiệm.'}</h1>
        <p className="lead">Mỗi ví được cấp quyền có một phiếu. Danh sách và thời hạn được khóa khi cuộc bầu chọn bắt đầu.</p>
        <p className="privacy-note">Lá phiếu và địa chỉ ví công khai trên blockchain. Một địa chỉ không tự chứng minh danh tính một người.</p>
      </section>
      {wallet.error && <p role="alert" className="notice error">{wallet.error}</p>}
      {wallet.wrongNetwork && <div role="alert" className="notice"><p>Ví đang ở mạng khác. Hãy chuyển sang {chain.name} ({chain.id}) để gửi giao dịch.</p><button onClick={() => void wallet.switchNetwork()}>Chuyển mạng trong ví</button></div>}
      <section className="network-strip" aria-label="Thông tin blockchain">
        <div><span className="label">Hợp đồng</span>{contractAddress ? explorer ? <a className="address" href={`${explorer}/address/${contractAddress}`} target="_blank" rel="noreferrer">{contractAddress}</a> : <span className="address">{contractAddress}</span> : <span>Chưa cấu hình địa chỉ</span>}</div>
        <button className="secondary" onClick={election.refresh}>Làm mới dữ liệu</button>
      </section>
      {!contractAddress && <p className="notice">Chưa có bản triển khai được cấu hình. Người quản lý cần cấu hình địa chỉ hợp đồng để mở cuộc bầu chọn.</p>}
      {(configurationError || election.error) && <p role="alert" className="notice error">{configurationError ?? election.error}</p>}
      {election.loading && <p role="status" className="notice">Đang đọc dữ liệu từ blockchain…</p>}
      {data && <>
        <section className="stats" aria-label="Tổng quan cuộc bầu chọn">
          <div><span className="label">Trạng thái</span><strong>{phases[data.phase]}</strong></div>
          <div><span className="label">Ứng viên</span><strong>{data.candidates.length}</strong></div>
          <div><span className="label">Phiếu đã ghi nhận</span><strong>{String(data.total)} / {String(data.registeredCount)}</strong></div>
        </section>
        <div className="time-strip"><span>Mở: {time(data.startTime)}</span><span>Kết thúc: {time(data.endTime)}</span>{data.phase === 1 && <span>{remaining ? `Còn khoảng ${Math.floor(remaining / 60)} phút ${remaining % 60} giây` : 'Đang chờ cập nhật block kết thúc…'}</span>}</div>
        {stale && <p role="alert" className="notice">Dữ liệu chưa được cập nhật. Tạm khóa giao dịch cho đến khi đọc được block mới.</p>}
        {admin && data.phase === 0 && <AdminPanel election={data} disabled={Boolean(blocked)} execute={execute} />}
        {admin && data.phase !== 0 && <p className="hint">Bạn là quản trị viên. Danh sách và thời hạn hiện đã khóa.</p>}
        <div className="columns">
          <BallotPanel key={`${wallet.account}:${data.phase}`} election={data} connected={Boolean(wallet.account)} disabled={Boolean(blocked) || (data.phase === 1 && remaining === 0)} vote={(id) => execute({ kind: 'vote', candidateId: id }, `Bỏ phiếu cho ${data.candidates[Number(id)]?.name}`)} />
          <ResultsPanel election={data} />
        </div>
      </>}
      {tx.status !== 'idle' && <section className={`transaction ${tx.status}`} aria-label="Trạng thái giao dịch" aria-live="polite">
        <strong>{tx.pending?.label ?? 'Giao dịch'}</strong><p>{tx.message}</p>
        {tx.pending && <><p className="hint">Ví gửi: <span className="address">{tx.pending.account}</span></p>{explorer ? <a className="address" href={`${explorer}/tx/${tx.pending.hash}`} target="_blank" rel="noreferrer">Xem giao dịch: {tx.pending.hash}</a> : <p className="address">Hash: {tx.pending.hash}</p>}</>}
        {tx.status === 'unknown' && <button onClick={() => void tx.retry()}>Kiểm tra xác nhận</button>}
      </section>}
      <footer>Solidity · Ethereum · CSE465<br />Kết quả tạm thời có thể thay đổi đến khi hết hạn. Giao dịch chỉ được ghi nhận khi thực thi thành công trên chain.</footer>
    </main>
  )
}
