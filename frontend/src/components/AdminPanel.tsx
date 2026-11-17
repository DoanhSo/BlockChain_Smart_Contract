import { useState } from 'react'
import type { VotingAction } from '../lib/transactions'
import type { Election } from '../lib/voting'
import { parseDuration, parseVoters } from '../lib/voting'
import { explainError, normalizeName } from '../lib/errors'

interface Props { election: Election; disabled: boolean; execute: (action: VotingAction, label: string) => Promise<boolean> }
export function AdminPanel({ election, disabled, execute }: Props) {
  const [name, setName] = useState('')
  const [voters, setVoters] = useState('')
  const [minutes, setMinutes] = useState('10')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  async function add() {
    setError('')
    try { if (await execute({ kind: 'addCandidate', name: normalizeName(name) }, 'Thêm ứng viên')) setName('') }
    catch (cause) { setError(explainError(cause)) }
  }
  async function register() {
    setError('')
    try { if (await execute({ kind: 'registerVoters', voters: parseVoters(voters) }, 'Đăng ký cử tri')) setVoters('') }
    catch (cause) { setError(explainError(cause)) }
  }
  async function start() {
    setError('')
    try { if (confirmed) await execute({ kind: 'startVoting', duration: parseDuration(minutes) }, 'Bắt đầu cuộc bầu chọn') }
    catch (cause) { setError(explainError(cause)) }
  }
  return (
    <section className="panel" aria-labelledby="admin-title">
      <p className="eyebrow">DÀNH CHO QUẢN TRỊ VIÊN</p><h2 id="admin-title">Chuẩn bị cuộc bầu chọn</h2>
      <p className="hint">Kiểm tra danh sách trước khi bắt đầu. Khi mở phiếu, không thể thêm ứng viên, cử tri hoặc đổi thời hạn.</p>
      <form onSubmit={(event) => { event.preventDefault(); void add() }}>
        <fieldset disabled={disabled || election.candidates.length >= 20}>
          <label htmlFor="candidate-name">Tên ứng viên</label>
          <div className="inline-form"><input id="candidate-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ví dụ: Nguyễn An" /><button type="submit">Thêm ứng viên</button></div>
          <small>Tối đa 20 ứng viên; mỗi tên tối đa 96 byte UTF-8.</small>
        </fieldset>
      </form>
      <form onSubmit={(event) => { event.preventDefault(); void register() }}>
        <fieldset disabled={disabled}>
          <label htmlFor="voter-addresses">Địa chỉ ví cử tri</label>
          <textarea id="voter-addresses" value={voters} onChange={(event) => setVoters(event.target.value)} rows={4} required placeholder="Mỗi dòng một địa chỉ 0x…" />
          <small>Mỗi lần 1–100 địa chỉ. Một địa chỉ lỗi hoặc đã đăng ký sẽ hủy toàn bộ lần đăng ký đó.</small>
          <button type="submit">Cấp quyền bỏ phiếu</button>
        </fieldset>
      </form>
      <form className="start-form" onSubmit={(event) => { event.preventDefault(); void start() }}>
        <fieldset disabled={disabled}>
          <label htmlFor="duration">Thời lượng bỏ phiếu (phút)</label>
          <input id="duration" type="number" min="1" max="43200" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} required />
          <label className="checkbox"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Tôi đã kiểm tra danh sách và đồng ý khóa cấu hình khi bắt đầu.</label>
          <button type="submit" disabled={!confirmed || election.candidates.length < 2 || election.registeredCount === 0n}>Bắt đầu bỏ phiếu</button>
          {(election.candidates.length < 2 || election.registeredCount === 0n) && <small>Cần ít nhất 2 ứng viên và 1 cử tri.</small>}
        </fieldset>
      </form>
      {error && <p role="alert" className="error">{error}</p>}
    </section>
  )
}
