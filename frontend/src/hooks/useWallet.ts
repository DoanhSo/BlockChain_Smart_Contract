import { useCallback, useEffect, useRef, useState } from 'react'
import { getAddress, isAddress, type Address, type EIP1193Provider } from 'viem'
import { chain } from '../lib/blockchain'
import { explainError } from '../lib/errors'

declare global { interface Window { ethereum?: EIP1193Provider } }
interface WalletState { account?: Address; chainId?: number; error?: string; connecting: boolean }

export function useWallet() {
  const [provider, setProvider] = useState(() => window.ethereum)
  const [state, setState] = useState<WalletState>({ connecting: false })
  const generation = useRef(0)
  const alive = useRef(true)
  const synchronize = useCallback(async () => {
    if (!provider) return
    const id = ++generation.current
    try {
      const [accounts, networkId] = await Promise.all([
        provider.request({ method: 'eth_accounts' }), provider.request({ method: 'eth_chainId' }),
      ])
      if (!alive.current || id !== generation.current) return
      setState({ account: accounts[0] && isAddress(accounts[0]) ? getAddress(accounts[0]) : undefined, chainId: Number(networkId), connecting: false })
    } catch (error) {
      if (alive.current && id === generation.current) setState({ connecting: false, error: explainError(error) })
    }
  }, [provider])

  useEffect(() => {
    const liveness = alive; const generations = generation
    liveness.current = true
    const discover = () => setProvider(window.ethereum)
    window.addEventListener('ethereum#initialized', discover)
    const changed = () => {
      ++generation.current
      setState({ connecting: false }) // Invalidate the previous account immediately.
      void synchronize()
    }
    const disconnected = () => { ++generation.current; setState({ connecting: false, error: 'Ví đã ngắt kết nối.' }) }
    provider?.on('accountsChanged', changed)
    provider?.on('chainChanged', changed)
    provider?.on('disconnect', disconnected)
    // synchronize() only sets state after awaiting the wallet provider, never synchronously.
    // oxlint-disable-next-line react/set-state-in-effect
    void synchronize()
    return () => {
      liveness.current = false; ++generations.current
      window.removeEventListener('ethereum#initialized', discover)
      provider?.removeListener('accountsChanged', changed)
      provider?.removeListener('chainChanged', changed)
      provider?.removeListener('disconnect', disconnected)
    }
  }, [provider, synchronize])

  async function connect() {
    if (!provider) { setState({ connecting: false, error: 'Cài hoặc mở MetaMask trong trình duyệt để kết nối ví.' }); return }
    setState((old) => ({ ...old, connecting: true, error: undefined }))
    try { await provider.request({ method: 'eth_requestAccounts' }); await synchronize() }
    catch (error) { if (alive.current) setState((old) => ({ ...old, connecting: false, error: explainError(error) })) }
  }

  async function switchNetwork() {
    if (!provider) return
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${chain.id.toString(16)}` }] })
      await synchronize()
    } catch (error) { setState((old) => ({ ...old, error: explainError(error) })) }
  }
  return { ...state, provider, connect, switchNetwork, wrongNetwork: state.account !== undefined && state.chainId !== chain.id }
}
