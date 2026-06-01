import { useMemo, useState, useEffect, useCallback } from 'react'
import { fetchFinancingApplications, reviewFinancing } from '../../../services/payments.service'
import { mapFinancingToFoRequest } from '../../../lib/mappers'
import { getErrorMessage } from '../../../lib/api'
import { StatusBadge } from './FoBadges'
import type { FoRequest } from './foHelpers'

export default function FoRequestsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [requests, setRequests] = useState<FoRequest[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [modal, setModal] = useState<FoRequest | null>(null)

  const loadRequests = useCallback(() => {
    fetchFinancingApplications()
      .then((apps) => {
        setRequests(apps.map(mapFinancingToFoRequest))
        setLoadError(null)
      })
      .catch((err) => {
        setRequests([])
        setLoadError(getErrorMessage(err))
      })
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const filtered = useMemo(() => {
    let list = [...requests]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((r) => r.ref.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.device.toLowerCase().includes(q))
    if (filterStatus) list = list.filter((r) => r.status === filterStatus)
    if (dateFrom) list = list.filter((r) => r.appliedAt >= dateFrom)
    if (dateTo) list = list.filter((r) => r.appliedAt <= dateTo)
    if (priceMin) list = list.filter((r) => parseFloat(r.price.replace(/[$,]/g, '')) >= parseFloat(priceMin))
    if (priceMax) list = list.filter((r) => parseFloat(r.price.replace(/[$,]/g, '')) <= parseFloat(priceMax))
    return list
  }, [requests, search, filterStatus, dateFrom, dateTo, priceMin, priceMax])

  const changeStatus = async (request: FoRequest, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(request.id)
    setActionError(null)
    try {
      await reviewFinancing({
        applicationId: request.id,
        status,
      })
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: status === 'APPROVED' ? 'Approved' : 'Rejected' } : r,
        ),
      )
      setModal((m) => (m?.id === request.id ? { ...m, status: status === 'APPROVED' ? 'Approved' : 'Rejected' } : m))
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setReviewingId(null)
    }
  }

  const resetFilters = () => { setSearch(''); setFilterStatus(''); setDateFrom(''); setDateTo(''); setPriceMin(''); setPriceMax('') }

  return (
    <div className="fo-page-wrap">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{loadError}</p>}
      {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{actionError}</p>}
      <div className="fo-filter-bar">
        <div className="fo-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></svg>
          <input type="search" placeholder="Search ref, customer, device…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="fo-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Pending</option><option>Approved</option><option>Rejected</option>
        </select>
        <label className="fo-date-field"><span>From</span><input type="date" className="fo-date-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
        <label className="fo-date-field"><span>To</span><input type="date" className="fo-date-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        <label className="fo-price-field"><span>Min $</span><input type="number" className="fo-price-input" placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} /></label>
        <label className="fo-price-field"><span>Max $</span><input type="number" className="fo-price-input" placeholder="9999" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} /></label>
        <button className="fo-btn-reset" onClick={resetFilters}>Reset</button>
      </div>

      <div className="fo-panel-card">
        <div className="fo-panel-header-row">
          <p className="fo-results-hint">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead><tr><th>Ref ID</th><th>Customer</th><th>Device</th><th>Price</th><th>Term</th><th>APR</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} className="fo-table-empty">No requests match your filters.</td></tr>
                : filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="fo-ref-cell">{r.ref}</td><td>{r.customer}</td><td>{r.device}</td>
                    <td>{r.price}</td><td>{r.term}</td><td>{r.apr}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="fo-muted">{r.appliedAt}</td>
                    <td>
                      <div className="fo-action-btns">
                        {r.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="fo-btn-approve"
                              disabled={reviewingId === r.id}
                              onClick={() => void changeStatus(r, 'APPROVED')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="fo-btn-reject"
                              disabled={reviewingId === r.id}
                              onClick={() => void changeStatus(r, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button type="button" className="fo-btn-view" onClick={() => setModal(r)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fo-modal-overlay" onClick={() => setModal(null)}>
          <div className="fo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fo-modal-header">
              <h3>Request Details — {modal.ref}</h3>
              <button type="button" className="fo-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="fo-modal-body">
              <div className="fo-detail-grid">
                {[['Customer', modal.customer], ['Device', modal.device], ['Price', modal.price], ['Term', modal.term], ['APR', modal.apr], ['Applied', modal.appliedAt]].map(([label, val]) => (
                  <div key={label} className="fo-detail-item"><span className="fo-detail-label">{label}</span><span>{val}</span></div>
                ))}
                <div className="fo-detail-item"><span className="fo-detail-label">Status</span><StatusBadge status={modal.status} /></div>
              </div>
              {modal.status === 'Pending' && (
                <div className="fo-modal-actions">
                  <button
                    type="button"
                    className="fo-btn-approve"
                    disabled={reviewingId === modal.id}
                    onClick={() => void changeStatus(modal, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="fo-btn-reject"
                    disabled={reviewingId === modal.id}
                    onClick={() => void changeStatus(modal, 'REJECTED')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
