import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../lib/api'
import { mapApiListingToListing } from '../lib/mappers'
import type { Listing } from '../features/marketplace/types'
import { fetchListings } from '../services/marketplace.service'

export function useListings(search?: string) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchListings(search ? { search } : undefined)
      setListings(rows.map(mapApiListingToListing))
    } catch (err) {
      setListings([])
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  return { listings, loading, error, reload: load }
}
