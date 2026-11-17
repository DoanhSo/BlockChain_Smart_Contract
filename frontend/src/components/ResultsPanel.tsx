import type { Election } from '../lib/voting'

export function ResultsPanel({ election }: { election: Election }) {
  const { outcome } = election
  const winners = election.candidates.filter((candidate) => outcome?.ids.includes(candidate.id))
  const result = !outcome ? 'Kết quả đang tạm thời, chưa xác định người thắng.' : outcome.kind === 0 ? 'Không có phiếu hợp lệ — không có người thắng.' : outcome.kind === 1 ? `Người thắng: ${winners[0]?.name ?? ''}` : `Hòa phiếu: ${winners.map((candidate) => candidate.name).join(', ')}`
  return (
    <section className="panel results" aria-labelledby="results-title">
      <p className="eyebrow">KIỂM PHIẾU CÔNG KHAI</p><h2 id="results-title">{election.phase === 2 ? 'Kết quả cuối cùng' : 'Kết quả tạm thời'}</h2>
      <p className={outcome ? 'outcome' : 'hint'}>{result}</p>
      <ul className="result-list">
        {election.candidates.map((candidate) => {
          const percent = election.total ? Number(candidate.votes * 10_000n / election.total) / 100 : 0
          return <li key={String(candidate.id)}>
            <div className="result-label"><span>{candidate.name}</span><strong>{String(candidate.votes)} phiếu · {percent}%</strong></div>
            <progress max="100" value={percent} aria-label={`Tỷ lệ phiếu của ${candidate.name}`} />
          </li>
        })}
      </ul>
      <p className="hint">{String(election.total)}/{String(election.registeredCount)} ví đã bỏ phiếu. Số liệu được đọc tại block {String(election.block)}.</p>
    </section>
  )
}
