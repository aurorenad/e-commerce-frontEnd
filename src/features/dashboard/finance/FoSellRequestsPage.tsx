import { useMemo, useState, useEffect, useCallback } from 'react'
import { fetchTradeIns, reviewTradeIn } from '../../../services/devices.service'
import { mapTradeInToFoSellRequest, type FoSellRequest } from '../../../lib/mappers'
import { getErrorMessage } from '../../../lib/api'
import { StatusBadge } from './FoBadges'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function FoSellRequestsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [requests, setRequests] = useState<FoSellRequest[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [modal, setModal] = useState<FoSellRequest | null>(null)
  const [officerNotes, setOfficerNotes] = useState('')
  const [finalOfferAmount, setFinalOfferAmount] = useState('')

  const loadRequests = useCallback(() => {
    fetchTradeIns()
      .then((rows) => {
        setRequests(rows.map(mapTradeInToFoSellRequest))
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
    if (q) {
      list = list.filter(
        (r) =>
          r.ref.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.device.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q),
      )
    }
    if (filterStatus) list = list.filter((r) => r.status === filterStatus)
    if (dateFrom) list = list.filter((r) => r.appliedAt >= dateFrom)
    if (dateTo) list = list.filter((r) => r.appliedAt <= dateTo)
    if (typeFilter) list = list.filter((r) => r.category.toLowerCase() === typeFilter.toLowerCase())
    return list
  }, [requests, search, filterStatus, dateFrom, dateTo, typeFilter])

  const reportRows = useMemo(
    () =>
      filtered.map((r) => ({
        ref: r.ref,
        customer: r.customer,
        email: r.email,
        phone: r.phone,
        device: r.device,
        type: r.category,
        condition: r.condition,
        askingPrice: r.askingPrice,
        aiOffer: r.aiOffer,
        repairEstimate: r.technicianRepairEstimate || '—',
        finalOffer: r.finalOffer || '—',
        status: r.status,
        submittedAt: r.appliedAt,
        technicianComment: r.technicianComment || '',
        officerNotes: r.officerNotes || '',
      })),
    [filtered],
  )

  const downloadPdfReport = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Sell Requests Report', 14, 14)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20)

    autoTable(doc, {
      startY: 26,
      head: [[
        'Ref', 'Customer', 'Email', 'Phone', 'Device', 'Type', 'Condition',
        'Asking Price', 'AI Offer', 'Repair Estimate', 'Final Offer', 'Status', 'Submitted At',
      ]],
      body: reportRows.map((row) => [
        row.ref,
        row.customer,
        row.email,
        row.phone,
        row.device,
        row.type,
        row.condition,
        row.askingPrice,
        row.aiOffer,
        row.repairEstimate,
        row.finalOffer,
        row.status,
        row.submittedAt,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 112, 88] },
    })

    doc.save(`sell-requests-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const changeStatus = async (request: FoSellRequest, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(request.id)
    setActionError(null)
    try {
      await reviewTradeIn({
        tradeInId: request.id,
        status,
        ...(status === 'APPROVED' && finalOfferAmount ? { finalOfferAmount: Number(finalOfferAmount) } : {}),
        officerNotes: officerNotes.trim() || undefined,
      })
      const label = status === 'APPROVED' ? 'Approved' : 'Rejected'
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: label,
                officerNotes: officerNotes.trim() || r.officerNotes,
                finalOffer: status === 'APPROVED' && finalOfferAmount ? `$${Number(finalOfferAmount).toLocaleString()}` : r.finalOffer,
              }
            : r,
        ),
      )
      setModal((m) =>
        m?.id === request.id
          ? {
              ...m,
              status: label,
              officerNotes: officerNotes.trim() || m.officerNotes,
              finalOffer: status === 'APPROVED' && finalOfferAmount ? `$${Number(finalOfferAmount).toLocaleString()}` : m.finalOffer,
            }
          : m,
      )
      setOfficerNotes('')
      setFinalOfferAmount('')
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setReviewingId(null)
    }
  }

  const openModal = (row: FoSellRequest) => {
    setModal(row)
    setOfficerNotes(row.officerNotes)
    setFinalOfferAmount(row.finalOffer ? row.finalOffer.replace(/[$,]/g, '') : '')
  }

  return (
    <div className="fo-page-wrap">
      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {actionError}
        </p>
      )}

      <div className="fo-filter-bar">
        <div className="fo-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            type="search"
            placeholder="Search ref, customer, device, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="fo-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Completed</option>
        </select>
        <label className="fo-date-field">
          <span>From</span>
          <input type="date" className="fo-date-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="fo-date-field">
          <span>To</span>
          <input type="date" className="fo-date-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <select className="fo-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option>Smartphone</option>
          <option>Laptop</option>
          <option>Tablet</option>
          <option>Smartwatch</option>
          <option>Camera</option>
          <option>Gaming</option>
        </select>
        <button type="button" className="fo-btn-view" onClick={downloadPdfReport}>
          Download report
        </button>
      </div>

      <div className="fo-panel-card">
        <div className="fo-panel-header-row">
          <p className="fo-results-hint">
            {filtered.length} sell request{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Asking</th>
                <th>AI offer</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="fo-table-empty">
                    No sell requests match your filters.
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
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
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
                              Accept
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
                        <button type="button" className="fo-btn-view" onClick={() => openModal(r)}>
                          View
                        </button>
                      </div>
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
              <h3>Sell request — {modal.ref}</h3>
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
                  ['Category', modal.category],
                  ['Condition', modal.condition],
                  ['Asking price', modal.askingPrice],
                  ['AI offer', modal.aiOffer],
                  ['Final offer', modal.finalOffer || '—'],
                  ['Submitted', modal.appliedAt],
                ].map(([label, val]) => (
                  <div key={label} className="fo-detail-item">
                    <span className="fo-detail-label">{label}</span>
                    <span>{val}</span>
                  </div>
                ))}
                <div className="fo-detail-item">
                  <span className="fo-detail-label">Status</span>
                  <StatusBadge status={modal.status} />
                </div>
              </div>

              {modal.aiReasoning && (
                <div className="fo-ai-block">
                  <span className="fo-detail-label">AI valuation notes</span>
                  <p>{modal.aiReasoning}</p>
                </div>
              )}

              <div className="fo-ai-block">
                <span className="fo-detail-label">Technician inspection comment</span>
                <p>
                  {modal.technicianComment
                    ? `${modal.technicianComment}${modal.technicianName ? ` (by ${modal.technicianName})` : ''}`
                    : 'Awaiting technician review.'}
                </p>
                <p className="mt-2">
                  <strong>Estimated repair cost:</strong> {modal.technicianRepairEstimate || '—'}
                </p>
              </div>

              {modal.defects && (
                <div className="fo-ai-block">
                  <span className="fo-detail-label">Customer notes / defects</span>
                  <p>{modal.defects}</p>
                </div>
              )}

              {modal.imageUrls.length > 0 && (
                <div className="fo-sell-images">
                  <span className="fo-detail-label">Device photos</span>
                  <div className="fo-sell-images-grid">
                    {modal.imageUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Device" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {modal.status === 'Pending' && (
                <>
                  <label className="fo-notes-field">
                    <span className="fo-detail-label">Final approved amount (required for approval)</span>
                    <input
                      type="number"
                      min={1}
                      value={finalOfferAmount}
                      onChange={(e) => setFinalOfferAmount(e.target.value)}
                      placeholder="e.g. 340"
                    />
                  </label>
                  <label className="fo-notes-field">
                    <span className="fo-detail-label">Officer notes (optional)</span>
                    <textarea
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      rows={3}
                      placeholder="Reason for acceptance or rejection…"
                    />
                  </label>
                  <div className="fo-modal-actions">
                    <button
                      type="button"
                      className="fo-btn-approve"
                      disabled={reviewingId === modal.id || !modal.technicianComment || !finalOfferAmount}
                      onClick={() => void changeStatus(modal, 'APPROVED')}
                    >
                      Accept request
                    </button>
                    <button
                      type="button"
                      className="fo-btn-reject"
                      disabled={reviewingId === modal.id}
                      onClick={() => void changeStatus(modal, 'REJECTED')}
                    >
                      Reject request
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
