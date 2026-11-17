import { getAddress, isAddress, zeroAddress, type Address } from 'viem'
import { votingAbi } from '../generated/voting'
import { client } from './blockchain'

export type VotingClient = NonNullable<typeof client>
export interface Election {
  title: string; admin: Address; phase: number; started: boolean
  startTime: bigint; endTime: bigint; total: bigint; registeredCount: bigint
  candidates: { id: bigint; name: string; votes: bigint }[]
  eligible: boolean; voted: boolean; block: bigint; timestamp: bigint
  outcome?: { kind: number; ids: readonly bigint[]; highest: bigint }
  fetchedAt: number
}

export async function loadElection(rpc: VotingClient, address: Address, account?: Address): Promise<Election> {
  if (await rpc.getChainId() !== rpc.chain.id) throw new Error('RPC đang kết nối sai mạng.')
  const block = await rpc.getBlock()
  if (block.number === null) throw new Error('Không đọc được block đã xác nhận.')
  const code = await rpc.getCode({ address, blockNumber: block.number })
  if (!code || code === '0x') throw new Error('Chưa có hợp đồng tại địa chỉ này. Kiểm tra mạng hoặc triển khai lại node local.')
  const base = { address, abi: votingAbi, blockNumber: block.number } as const
  const [title, admin, phase, started, startTime, endTime, total, registeredCount, count, eligible, voted] = await Promise.all([
    rpc.readContract({ ...base, functionName: 'electionTitle' }),
    rpc.readContract({ ...base, functionName: 'admin' }),
    rpc.readContract({ ...base, functionName: 'phase' }),
    rpc.readContract({ ...base, functionName: 'started' }),
    rpc.readContract({ ...base, functionName: 'startTime' }),
    rpc.readContract({ ...base, functionName: 'endTime' }),
    rpc.readContract({ ...base, functionName: 'totalVotes' }),
    rpc.readContract({ ...base, functionName: 'registeredVoterCount' }),
    rpc.readContract({ ...base, functionName: 'candidateCount' }),
    account ? rpc.readContract({ ...base, functionName: 'isRegistered', args: [account] }) : false,
    account ? rpc.readContract({ ...base, functionName: 'hasVoted', args: [account] }) : false,
  ])
  if (count > 20n) throw new Error('Hợp đồng không đúng phiên bản Voting được hỗ trợ.')
  const candidates = await Promise.all(Array.from({ length: Number(count) }, async (_, i) => {
    const [name, votes] = await rpc.readContract({ ...base, functionName: 'getCandidate', args: [BigInt(i)] })
    return { id: BigInt(i), name, votes }
  }))
  const result = phase === 2 ? await rpc.readContract({ ...base, functionName: 'getOutcome' }) : undefined
  return { title, admin, phase, started, startTime, endTime, total, registeredCount, candidates, eligible, voted,
    block: block.number, timestamp: block.timestamp, fetchedAt: Date.now(),
    outcome: result ? { kind: result[0], ids: result[1], highest: result[2] } : undefined }
}

export function parseVoters(input: string): Address[] {
  const entries = input.trim().split(/[\s,;]+/).filter(Boolean)
  if (!entries.length || entries.length > 100) throw new Error('Nhập từ 1 đến 100 địa chỉ, ngăn cách bằng dòng mới, dấu phẩy hoặc dấu chấm phẩy.')
  const result = entries.map((entry) => {
    if (!isAddress(entry) || entry.toLowerCase() === zeroAddress) throw new Error(`Địa chỉ không hợp lệ: ${entry}`)
    return getAddress(entry)
  })
  if (new Set(result.map((address) => address.toLowerCase())).size !== result.length) throw new Error('Danh sách có địa chỉ bị trùng; hãy sửa trước khi gửi.')
  return result
}

export function parseDuration(minutes: string): bigint {
  if (!/^\d+$/.test(minutes)) throw new Error('Thời lượng phải là số phút nguyên.')
  const seconds = BigInt(minutes) * 60n
  if (seconds < 60n || seconds > 2_592_000n) throw new Error('Thời lượng phải từ 1 đến 43200 phút (30 ngày).')
  return seconds
}
