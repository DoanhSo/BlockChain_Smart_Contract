import { BaseError, ContractFunctionRevertedError } from 'viem'

const contractErrors: Record<string, string> = {
  Unauthorized: 'Chỉ quản trị viên được thực hiện thao tác này.',
  InvalidPhase: 'Cuộc bầu chọn không còn ở giai đoạn cho phép thao tác này.',
  InvalidTitle: 'Tiêu đề phải có từ 1 đến 160 byte UTF-8.',
  InvalidCandidateName: 'Tên ứng viên phải có từ 1 đến 96 byte UTF-8.',
  DuplicateCandidate: 'Tên ứng viên đã tồn tại.',
  CandidateLimitReached: 'Đã đạt giới hạn 20 ứng viên.',
  InvalidVoter: 'Địa chỉ cử tri không hợp lệ hoặc là địa chỉ 0.',
  AlreadyRegistered: 'Một địa chỉ trong danh sách đã được đăng ký hoặc bị trùng.',
  InvalidBatchSize: 'Mỗi lần đăng ký cần từ 1 đến 100 địa chỉ.',
  InsufficientCandidates: 'Cần ít nhất 2 ứng viên trước khi bắt đầu.',
  NoRegisteredVoters: 'Cần ít nhất 1 cử tri trước khi bắt đầu.',
  InvalidDuration: 'Thời lượng phải từ 60 giây đến 30 ngày.',
  NotRegistered: 'Ví này chưa được cấp quyền bỏ phiếu.',
  AlreadyVoted: 'Ví này đã bỏ phiếu. Mỗi ví chỉ có một phiếu.',
  InvalidCandidate: 'Ứng viên không tồn tại.',
  ResultsNotFinal: 'Cuộc bầu chọn chưa kết thúc.',
}

export function explainError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError && reverted.data) {
      return contractErrors[reverted.data.errorName] ?? 'Hợp đồng từ chối giao dịch.'
    }
  }
  let cause = error
  const seen = new Set<unknown>()
  while (cause && typeof cause === 'object' && !seen.has(cause)) {
    seen.add(cause)
    const value = cause as { code?: number; name?: string; cause?: unknown }
    if (value.code === 4001 || value.name === 'UserRejectedRequestError') return 'Bạn đã từ chối yêu cầu trong ví. Chưa gửi giao dịch.'
    if (value.code === -32002) return 'Một yêu cầu đang chờ trong ví. Mở ví để hoàn tất hoặc hủy.'
    if (value.code === 4902) return 'Ví chưa có mạng này. Thêm mạng trong ví rồi kết nối lại.'
    if (value.name === 'InsufficientFundsError') return 'Ví chưa đủ ETH trên mạng đang chọn để trả gas.'
    cause = value.cause
  }
  return error instanceof Error ? error.message : 'Không thực hiện được thao tác. Kiểm tra kết nối RPC và ví.'
}

export function normalizeName(value: string): string {
  const name = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!name || new TextEncoder().encode(name).length > 96) throw new Error(contractErrors.InvalidCandidateName)
  return name
}
