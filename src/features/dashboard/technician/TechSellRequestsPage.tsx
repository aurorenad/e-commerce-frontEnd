import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTradeIns, technicianReviewTradeIn } from '../../../services/devices.service'
import { mapTradeInToFoSellRequest, type FoSellRequest } from '../../../lib/mappers'
import { getErrorMessage } from '../../../lib/api'

interface Props {
  onOpenProfile: () => void
}

export default function TechSellRequestsPage({ onOpenProfile }: Props) {
  const [search, setSearch] = useState('')
  const [requests, setRequests] = useState<FoSellRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [modal, setModal] = useState<FoSellRequest | null>(null)
  const [comment, setComment] = useState('')
  const [repairEstimate, setRepairEstimate] = useState('')

  const loadRequests = useCallback(() => {
    fetchTradeIns()
      .then((rows) => {
        const pending = rows.map(mapTradeInToFoSellRequest).filter((r) => r.status === 'Pending')
        setRequests(pending)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter(
      (r) =>
        r.ref.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.device.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    )
  }, [requests, search])

  async function saveComment() {
    if (!modal) return
    const trimmed = comment.trim()
    if (!trimmed) return

    setSavingId(modal.id)
    setError(null)
    try {
      await technicianReviewTradeIn({
        tradeInId: modal.id,
        technicianComment: trimmed,
        repairEstimate: Number(repairEstimate),
      })
      setRequests((prev) =>
        prev.map((r) =>
          r.id === modal.id
            ? { ...r, technicianComment: trimmed, technicianRepairEstimate: `$${Number(repairEstimate).toLocaleString()}` }
            : r,
        ),
      )
      setModal((prev) =>
        prev ? { ...prev, technicianComment: trimmed, technicianRepairEstimate: `$${Number(repairEstimate).toLocaleString()}` } : prev,
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const openModal = (row: FoSellRequest) => {
    setModal(row)
    setComment(row.technicianComment || '')
    setRepairEstimate(row.technicianRepairEstimate ? row.technicianRepairEstimate.replace(/[$,]/g, '') : '')
  }

  return (
    <section className="tw-page-wrap">
      <header className="tw-page-header tw-page-header--actions">
        <div>
          <h1 className="tw-page-title">Sell Request Inspections</h1>
          <p className="tw-page-sub">Run checks and submit technician comments for finance approval.</p>
        </div>
        <button type="button" className="tw-ghost-btn" onClick={onOpenProfile}>
          Update profile
        </button>
      </header>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="tw-card">
        <div className="tw-filters-row">
          <div className="tw-search-box">
            <input
              type="search"
              placeholder="Search ref, customer, device, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tw-card">
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Asking</th>
                <th>AI Offer</th>
                <th>Repair Estimate</th>
                <th>Tech Comment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="fo-table-empty">
                    No pending sell requests.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="fo-ref-cell">{r.ref}</td>
                    <td>{r.customer}</td>
                    <td>{r.device}</td>
                    <td>{r.askingPrice}</td>
                    <td>{r.aiOffer}</td>
                    <td>{r.technicianRepairEstimate || '—'}</td>
                    <td>{r.technicianComment ? 'Added' : 'Missing'}</td>
                    <td>
                      <button type="button" className="fo-btn-view" onClick={() => openModal(r)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fo-modal-overlay" onClick={() => setModal(null)}>
          <div className="fo-modal fo-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="fo-modal-header">
              <h3>Inspection review — {modal.ref}</h3>
              <button type="button" className="fo-modal-close" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>
            <div className="fo-modal-body">
              <div className="fo-detail-grid">
                {[
                  ['Customer', modal.customer],
                  ['Email', modal.email],
                  ['Phone', modal.phone],
                  ['Device', modal.device],
                  ['Condition', modal.condition],
                  ['Asking price', modal.askingPrice],
                  ['AI offer', modal.aiOffer],
                ].map(([label, val]) => (
                  <div key={label} className="fo-detail-item">
                    <span className="fo-detail-label">{label}</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>

              {modal.defects && (
                <div className="fo-ai-block">
                  <span className="fo-detail-label">Customer notes / defects</span>
                  <p>{modal.defects}</p>
                </div>
              )}

              <label className="fo-notes-field">
                <span className="fo-detail-label">Estimated repair cost (USD)</span>
                <input
                  type="number"
                  min={0}
                  value={repairEstimate}
                  onChange={(e) => setRepairEstimate(e.target.value)}
                  placeholder="e.g. 80"
                />
              </label>

              <label className="fo-notes-field">
                <span className="fo-detail-label">Technician test comment</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Add your test outcome, observed condition, and recommendation for finance..."
                />
              </label>

              <div className="fo-modal-actions">
                <button
                  type="button"
                  className="fo-btn-approve"
                  disabled={savingId === modal.id || !comment.trim() || repairEstimate === ''}
                  onClick={() => void saveComment()}
                >
                  {savingId === modal.id ? 'Saving…' : 'Save technician comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
