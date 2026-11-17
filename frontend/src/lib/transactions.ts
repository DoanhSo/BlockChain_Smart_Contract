import { createWalletClient, custom, encodeFunctionData, getAddress, type Address, type EIP1193Provider, type Hash } from 'viem'
import { votingAbi } from '../generated/voting'
import { chain, client, contractAddress } from './blockchain'

export type VotingAction =
  | { kind: 'addCandidate'; name: string }
  | { kind: 'registerVoters'; voters: Address[] }
  | { kind: 'startVoting'; duration: bigint }
  | { kind: 'vote'; candidateId: bigint }

export interface PendingTransaction { hash: Hash; account: Address; data: Hash; label: string }
export class TransactionNotApplied extends Error {}

export async function submitAction(provider: EIP1193Provider, account: Address, action: VotingAction): Promise<{ hash: Hash; data: Hash }> {
  if (!client || !contractAddress) throw new Error('Chưa cấu hình hợp đồng.')
  const wallet = createWalletClient({ chain, transport: custom(provider) })
  async function validateContext() {
    const [accounts, walletChain, rpcChain] = await Promise.all([wallet.getAddresses(), wallet.getChainId(), client!.getChainId()])
    if (!accounts[0] || getAddress(accounts[0]) !== getAddress(account)) throw new Error('Tài khoản ví đã thay đổi. Hãy thực hiện lại với ví hiện tại.')
    if (walletChain !== chain.id || rpcChain !== chain.id) throw new Error('Mạng của ví hoặc RPC đã thay đổi. Chuyển về mạng cấu hình trước khi gửi.')
  }
  await validateContext()
  const base = { address: contractAddress, abi: votingAbi, account } as const
  // Each branch stays ABI-typed through simulation and signing.
  if (action.kind === 'addCandidate') {
    const args = [action.name] as const
    const { request } = await client.simulateContract({ ...base, functionName: 'addCandidate', args })
    await validateContext()
    return { hash: await wallet.writeContract(request), data: encodeFunctionData({ abi: votingAbi, functionName: 'addCandidate', args }) }
  }
  if (action.kind === 'registerVoters') {
    const args = [action.voters] as const
    const { request } = await client.simulateContract({ ...base, functionName: 'registerVoters', args })
    await validateContext()
    return { hash: await wallet.writeContract(request), data: encodeFunctionData({ abi: votingAbi, functionName: 'registerVoters', args }) }
  }
  if (action.kind === 'startVoting') {
    const args = [action.duration] as const
    const { request } = await client.simulateContract({ ...base, functionName: 'startVoting', args })
    await validateContext()
    return { hash: await wallet.writeContract(request), data: encodeFunctionData({ abi: votingAbi, functionName: 'startVoting', args }) }
  }
  const args = [action.candidateId] as const
  const { request } = await client.simulateContract({ ...base, functionName: 'vote', args })
  await validateContext()
  return { hash: await wallet.writeContract(request), data: encodeFunctionData({ abi: votingAbi, functionName: 'vote', args }) }
}

export async function confirmTransaction(pending: PendingTransaction, onHash: (hash: Hash) => void) {
  if (!client || !contractAddress) throw new Error('Chưa cấu hình hợp đồng.')
  let replacement: string | undefined
  const receipt = await client.waitForTransactionReceipt({
    hash: pending.hash, confirmations: 1, timeout: 120_000,
    onReplaced: (event) => { replacement = event.reason; onHash(event.transaction.hash) },
  })
  if (replacement === 'cancelled' || replacement === 'replaced') throw new TransactionNotApplied('Giao dịch đã bị hủy hoặc thay thế bằng thao tác khác. Phiếu/thao tác ban đầu chưa được xác nhận.')
  const actual = await client.getTransaction({ hash: receipt.transactionHash })
  if (actual.from.toLowerCase() !== pending.account.toLowerCase() || actual.to?.toLowerCase() !== contractAddress.toLowerCase() || actual.input !== pending.data || actual.value !== 0n) {
    throw new TransactionNotApplied('Giao dịch xác nhận không khớp thao tác đã yêu cầu.')
  }
  if (receipt.status !== 'success') throw new TransactionNotApplied('Giao dịch đã revert. Dữ liệu hợp đồng không thay đổi; gas có thể đã được sử dụng.')
  return receipt
}
