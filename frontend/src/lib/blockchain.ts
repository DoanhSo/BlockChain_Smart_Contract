import { createPublicClient, getAddress, http, isAddress } from 'viem'
import { hardhat, sepolia } from 'viem/chains'

const chainId = import.meta.env.VITE_CHAIN_ID?.trim() || '31337'
const rawAddress = import.meta.env.VITE_VOTING_ADDRESS?.trim()
const rpcUrl = import.meta.env.VITE_RPC_URL?.trim()

export const chain = chainId === '11155111' ? sepolia : hardhat
export const contractAddress = rawAddress && isAddress(rawAddress) ? getAddress(rawAddress) : undefined
export const configurationError = !['31337', '11155111'].includes(chainId)
  ? 'VITE_CHAIN_ID phải là 31337 (local) hoặc 11155111 (Sepolia).'
  : rawAddress && !contractAddress
    ? 'VITE_VOTING_ADDRESS không phải địa chỉ Ethereum hợp lệ.'
    : chainId === '11155111' && !rpcUrl
      ? 'Cần cấu hình VITE_RPC_URL cho Sepolia.'
      : undefined

export const client = configurationError ? undefined : createPublicClient({
  chain,
  transport: http(rpcUrl || 'http://127.0.0.1:8545', { retryCount: 1, timeout: 10_000 }),
})
