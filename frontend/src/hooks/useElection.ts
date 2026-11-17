import { useCallback, useEffect, useState } from 'react'
import type { Address } from 'viem'
import { client, contractAddress, configurationError } from '../lib/blockchain'
import { loadElection, type Election } from '../lib/voting'
import { explainError } from '../lib/errors'

export function useElection(account?: Address) {
  const key = `${contractAddress ?? ''}:${account ?? ''}`
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ key: string; data?: Election; error?: string; loading: boolean }>({ key: '', loading: true })
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    const rpc = client; const address = contractAddress
    async function poll() {
      if (!rpc || !address) {
        setState({ key, loading: false, error: configurationError ?? 'Chưa cấu hình địa chỉ hợp đồng.' }); return
      }
      try {
        const data = await loadElection(rpc, address, account)
        if (!disposed) setState({ key, data, loading: false })
      } catch (error) {
        if (!disposed) setState({ key, error: explainError(error), loading: false })
      }
      if (!disposed) timer = setTimeout(() => void poll(), 4_000)
    }
    void poll()
    return () => { disposed = true; clearTimeout(timer) }
  }, [account, key, revision])
  return { ...(state.key === key ? state : { loading: true, data: undefined, error: undefined }), refresh }
}
