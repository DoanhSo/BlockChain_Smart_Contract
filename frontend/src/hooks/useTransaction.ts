import { useRef, useState } from 'react'
import type { Address, EIP1193Provider } from 'viem'
import { confirmTransaction, submitAction, TransactionNotApplied, type PendingTransaction, type VotingAction } from '../lib/transactions'
import { explainError } from '../lib/errors'

type Status = 'idle' | 'signing' | 'pending' | 'success' | 'error' | 'unknown'
export function useTransaction(refresh: () => void) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<PendingTransaction>()
  const lock = useRef(false)

  async function wait(transaction: PendingTransaction) {
    setStatus('pending'); setMessage('Đang chờ giao dịch được xác nhận…')
    try {
      await confirmTransaction(transaction, (hash) => setPending((old) => old ? { ...old, hash } : old))
      setStatus('success'); setMessage('Giao dịch thành công trong block. Đang cập nhật dữ liệu hợp đồng.')
      refresh(); lock.current = false
      return true
    } catch (error) {
      const terminal = error instanceof TransactionNotApplied
      setStatus(terminal ? 'error' : 'unknown')
      setMessage(terminal ? explainError(error) : 'Chưa xác định được kết quả giao dịch. Không gửi lại; kiểm tra hash hoặc bấm kiểm tra xác nhận.')
      lock.current = !terminal
      refresh(); return false
    }
  }

  async function execute(provider: EIP1193Provider | undefined, account: Address | undefined, action: VotingAction, label: string) {
    if (lock.current) return false
    if (!provider || !account) { setMessage('Kết nối ví trước khi giao dịch.'); setStatus('error'); return false }
    lock.current = true; setPending(undefined); setStatus('signing'); setMessage('Kiểm tra giao dịch và xác nhận trong ví…')
    try {
      const { hash, data } = await submitAction(provider, account, action)
      const transaction = { hash, data, account, label }
      setPending(transaction)
      return await wait(transaction)
    } catch (error) {
      lock.current = false; setStatus('error'); setMessage(explainError(error)); refresh(); return false
    }
  }

  async function retry() { if (pending && status === 'unknown') await wait(pending) }
  return { status, message, pending, execute, retry, busy: status === 'signing' || status === 'pending' || status === 'unknown' }
}
