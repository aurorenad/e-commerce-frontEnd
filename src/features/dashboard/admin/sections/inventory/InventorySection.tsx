import { useMemo, useState, useEffect } from 'react'
import { fetchDevices } from '../../../../../services/devices.service'
import { mapApiDeviceToInventory } from '../../../../../lib/mappers'
import type { Device } from '../../../shared/types/dashboard.types'
import Pagination from '../../../shared/components/Pagination'
import { DeviceViewModal, DeviceEditModal, AdjustStockModal } from './DeviceModals'
import DeviceIntakeModal from './DeviceIntakeModal'
import { getStockStatus, INV_CATEGORIES, INV_WAREHOUSES, PAGE_SIZE } from './inventoryHelpers'
import '../../../shared/styles/dashboard-shared.css'
import './InventorySection.css'

export default function InventorySection() {
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [whFilter, setWhFilter]   = useState('All')
  const [stFilter, setStFilter]   = useState('All')
  const [sortKey, setSortKey]     = useState<'model' | 'stock'>('model')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [page, setPage]           = useState(1)
  const [devices, setDevices]     = useState<Device[]>([])
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [viewDev, setViewDev]     = useState<Device | null>(null)

  useEffect(() => {
    fetchDevices()
      .then((rows) => { setDevices(rows.map(mapApiDeviceToInventory)); setLoadError(null) })
      .catch((err) => { setDevices([]); setLoadError(err instanceof Error ? err.message : 'Failed to load inventory') })
  }, [])
  const [editDev, setEditDev]     = useState<Device | null>(null)
  const [adjDev, setAdjDev]       = useState<Device | null>(null)
  const [showIntake, setShowIntake] = useState(false)

  const handleSave = (updated: Device) =>
    setDevices((prev) => prev.map((d) => d.sku === updated.sku ? updated : d))

  const counts = useMemo(() => ({
    total:   devices.reduce((s, d) => s + d.stock, 0),
    inStock: devices.filter((d) => d.stock > 10).length,
    atRisk:  devices.filter((d) => d.stock <= 10).length,
  }), [devices])

  const maxStock = useMemo(() => Math.max(...devices.map((d) => d.stock)), [devices])

  const filtered = useMemo(() => {
    type DeviceWithStatus = Device & { status: string }
    let list: DeviceWithStatus[] = devices.map((d) => ({ ...d, status: getStockStatus(d.stock) }))
    if (catFilter !== 'All') list = list.filter((d) => d.category === catFilter)
    if (whFilter  !== 'All') list = list.filter((d) => d.warehouse === whFilter)
    if (stFilter  !== 'All') list = list.filter((d) => d.status    === stFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((d) =>
      d.sku.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || d.warehouse.toLowerCase().includes(q),
    )
    return [...list].sort((a, b) => {
      const va = sortKey === 'stock' ? a.stock : a[sortKey].toLowerCase()
      const vb = sortKey === 'stock' ? b.stock : b[sortKey].toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [search, catFilter, whFilter, stFilter, sortKey, sortDir, devices])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  const handleSort = (key: 'model' | 'stock') => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ k }: { k: string }) => (
    <span className={`inv-sort-icon ${sortKey === k ? 'inv-sort-icon--active' : ''}`}>
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const kpis = [
    { label: 'Total Units', value: counts.total, hint: `${devices.length} SKUs tracked`, bg: 'rgba(2,92,80,0.09)', fg: '#025c50', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
    { label: 'In Stock',    value: counts.inStock, hint: 'Above 10 units', bg: 'rgba(34,197,94,0.1)', fg: '#15803d', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
    { label: 'At Risk',     value: counts.atRisk, hint: '≤ 10 units — reorder', bg: 'rgba(239,68,68,0.1)', fg: '#b91c1c', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
    { label: 'Avg Turnover', value: '18 days', hint: 'Last 30 days', bg: 'rgba(59,130,246,0.1)', fg: '#1d4ed8', icon: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></> },
  ]

  return (
    <div className="section-stack">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>}
      <section className="um-kpi-grid" aria-label="Inventory metrics">
        {kpis.map((k) => (
          <article className="um-kpi-card" key={k.label}>
            <div className="um-kpi-top">
              <span className="um-kpi-icon" style={{ background: k.bg, color: k.fg }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>{k.icon}</svg>
              </span>
            </div>
            <p className="um-kpi-value">{k.value}</p>
            <p className="um-kpi-label">{k.label}</p>
            <p className="um-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <article className="panel-card">
        <div className="um-toolbar">
          <button type="button" className="um-btn-primary" onClick={() => setShowIntake(true)}>
            + Register device
          </button>
          <div className="search-field search-field--compact">
            <svg className="icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input type="search" placeholder="Search SKU, model, or warehouse…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div className="um-filters">
            <label className="um-filter-group"><span className="um-filter-label">Category</span>
              <select className="um-select" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}>
                <option value="All">All categories</option>
                {INV_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="um-filter-group"><span className="um-filter-label">Warehouse</span>
              <select className="um-select" value={whFilter} onChange={(e) => { setWhFilter(e.target.value); setPage(1) }}>
                <option value="All">All warehouses</option>
                {INV_WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
              </select>
            </label>
            <label className="um-filter-group"><span className="um-filter-label">Status</span>
              <select className="um-select" value={stFilter} onChange={(e) => { setStFilter(e.target.value); setPage(1) }}>
                <option value="All">All statuses</option>
                <option>In Stock</option><option>Low Stock</option><option>Critical</option><option>Out of Stock</option>
              </select>
            </label>
          </div>
        </div>

        <div className="table-scroll">
          <table className="admin-table um-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th><button type="button" className="inv-sort-btn" onClick={() => handleSort('model')}>Model <SortIcon k="model" /></button></th>
                <th>Category</th>
                <th><button type="button" className="inv-sort-btn" onClick={() => handleSort('stock')}>Stock <SortIcon k="stock" /></button></th>
                <th>Warehouse</th><th>Condition</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((device) => {
                const pct = Math.round((device.stock / maxStock) * 100)
                const fillColor = device.stock === 0 ? '#d1d5db' : device.stock > 10 ? '#22c55e' : device.stock >= 5 ? '#f59e0b' : '#ef4444'
                return (
                  <tr key={device.sku}>
                    <td><span className="inv-sku">{device.sku}</span></td>
                    <td className="inv-model">{device.model}</td>
                    <td>{device.category}</td>
                    <td>
                      <div className="inv-stock-cell">
                        <span className="inv-stock-units">{device.stock} units</span>
                        <div className="inv-stock-track"><div className="inv-stock-fill" style={{ width: `${pct}%`, background: fillColor }} /></div>
                      </div>
                    </td>
                    <td>{device.warehouse}</td>
                    <td>{device.condition}</td>
                    <td>
                      <div className="um-actions">
                        <button type="button" className="um-action-btn um-action-view" onClick={() => setViewDev(device)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          <span>View</span>
                        </button>
                        <button type="button" className="um-action-btn um-action-edit" onClick={() => setEditDev(device)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          <span>Edit</span>
                        </button>
                        <button type="button" className="um-action-btn um-action-adjust" onClick={() => setAdjDev(device)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && <tr><td colSpan={7} className="um-empty">No devices match your filters.</td></tr>}
            </tbody>
          </table>
        </div>

        <Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} itemLabel="devices" onPageChange={goTo} />
      </article>

      {viewDev && <DeviceViewModal device={viewDev} onClose={() => setViewDev(null)} />}
      {editDev && <DeviceEditModal device={editDev} onClose={() => setEditDev(null)} onSave={handleSave} />}
      {adjDev  && <AdjustStockModal device={adjDev} onClose={() => setAdjDev(null)} onSave={handleSave} />}
      {showIntake && (
        <DeviceIntakeModal
          onClose={() => setShowIntake(false)}
          onCreated={(d) => setDevices((prev) => [d, ...prev])}
        />
      )}
    </div>
  )
}
