import { useState } from 'react'
import type { Election } from '../lib/voting'

interface Props { election: Election; connected: boolean; disabled: boolean; vote: (id: bigint) => Promise<boolean> }
export function BallotPanel({ election, connected, disabled, vote }: Props) {
  const [choice, setChoice] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const canVote = connected && election.eligible && !election.voted && election.phase === 1 && !disabled
  const reason = !connected ? 'Kết nối ví để xem quyền bỏ phiếu.' : !election.eligible ? 'Ví hiện tại chưa được cấp quyền bỏ phiếu.' : election.voted ? 'Ví này đã bỏ phiếu. Cảm ơn bạn đã tham gia.' : election.phase === 0 ? 'Cuộc bầu chọn chưa bắt đầu.' : election.phase === 2 ? 'Cuộc bầu chọn đã kết thúc.' : 'Chọn một ứng viên. Phiếu đã xác nhận không thể thay đổi.'
  return (
    <section className="panel" aria-labelledby="ballot-title">
      <p className="eyebrow">LÁ PHIẾU CỦA BẠN</p><h2 id="ballot-title">Chọn người đại diện</h2>
      <p className="hint">{reason}</p>
      <form onSubmit={(event) => { event.preventDefault(); if (canVote && confirmed && choice !== '') void vote(BigInt(choice)) }}>
        <fieldset disabled={!canVote}>
          <legend className="sr-only">Danh sách ứng viên</legend>
          {election.candidates.map((candidate) => (
            <label className={`candidate-option ${choice === String(candidate.id) ? 'selected' : ''}`} key={String(candidate.id)}>
              <input type="radio" name="candidate" value={String(candidate.id)} checked={choice === String(candidate.id)} onChange={(event) => { setChoice(event.target.value); setConfirmed(false) }} />
              <span><strong>{candidate.name}</strong><small>Ứng viên #{String(candidate.id)}</small></span>
            </label>
          ))}
          {election.candidates.length === 0 && <p className="hint">Quản trị viên chưa thêm ứng viên.</p>}
          {election.phase === 1 && connected && election.eligible && !election.voted && <>
            <label className="checkbox"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Tôi xác nhận lựa chọn và hiểu rằng lá phiếu được công khai, không thể đổi.</label>
            <button type="submit" disabled={choice === '' || !confirmed}>Xác nhận và ký phiếu</button>
          </>}
        </fieldset>
      </form>
    </section>
  )
}
