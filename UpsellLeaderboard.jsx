'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import posthog from 'posthog-js'
import { DM_ALIGNMENT, DM_MAP } from './promoConstants.js'

const ALL_DMS = Object.keys(DM_ALIGNMENT).filter(k => k !== 'OPEN').sort()

const ROLE_MAP = {
  'Pedro Ortega':   'Pedro Ortega · DM',
  'Carlos Tenorio': 'Carlos Tenorio · DM',
  'Lavasha Rouse':  'Lavasha Rouse · DM',
  'Shawn Haman':    'Shawn Haman · DM',
  'Jay Tarantino':  'Jay Tarantino · DM',
  'James Frazine':  'James Frazine · DM',
  'Kyle Lusher':    'Kyle Lusher · DM',
}

const SUPABASE_URL = 'https://pezcvxcazdvkggoljakh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlemN2eGNhemR2a2dnb2xqYWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ0MjUsImV4cCI6MjA5MzU5MDQyNX0.oOwzvUeWwfXokkqmmkgGCHi6koeHRL2al0Pg-xrW_EQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function fmtPct(v) {
  if (v == null) return '—'
  return v.toFixed(1) + '%'
}

function fmtN(v) {
  return Math.round(v).toLocaleString('en-US')
}

function attachColorClass(pct) {
  if (pct == null) return 'text-slate-500'
  if (pct >= 20) return 'text-emerald-400 font-bold'
  if (pct >= 10) return 'text-amber-400 font-bold'
  return 'text-rose-400 font-bold'
}

function dmFirst(dm) {
  if (!dm || dm === 'Unknown') return '—'
  return dm.trim().split(/\s+/)[0]
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60_000)    return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function KpiCard({ label, rate, totalChecks, range }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-center min-w-[100px]">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-[22px] font-bold text-white tabular-nums leading-none">{fmtPct(rate)}</div>
      <div className="text-[9px] text-slate-500 mt-1.5">{fmtN(totalChecks || 0)} checks</div>
      <div className="text-[9px] text-slate-600">{range}</div>
    </div>
  )
}

function RankCell({ rank }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>
  return <span className="text-[13px] font-bold text-slate-500 tabular-nums">{rank}</span>
}

function LoginModal({ onLogin, apiBase }) {
  const [name,         setName]         = useState('')
  const [results,      setResults]      = useState(null)
  const [searching,    setSearching]    = useState(false)
  const [selected,     setSelected]     = useState(null)
  const [storeId,      setStoreId]      = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  function handleNameChange(val) {
    setName(val)
    if (selected) { setSelected(null); setStoreId('') }
    if (val.trim().length < 2) { setResults(null); setShowDropdown(false) }
  }

  useEffect(() => {
    if (selected || name.trim().length < 2) return
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`${apiBase}/api/employee-lookup?name=${encodeURIComponent(name.trim())}`)
        const d = await r.json()
        setResults(r.ok ? (d.employees ?? []) : [])
        setShowDropdown(true)
      } catch {
        setResults([])
        setShowDropdown(true)
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [name, selected, apiBase])

  function handleSelect(emp) {
    setName(emp.fullName)
    setSelected(emp)
    setStoreId(String(emp.homeLocRef))
    setResults(null)
    setShowDropdown(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const sid = storeId || null
    const storeName = selected?.storeName ?? null
    const dmName = sid ? (DM_MAP[Number(sid)] ?? null) : null
    onLogin({ name: trimmed, storeId: sid, storeName, dmName })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0e1a2b] border border-slate-700 rounded-2xl px-8 py-8 w-full max-w-sm mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏆</div>
          <h2 className="text-[18px] font-black uppercase tracking-widest text-[#F5831F] leading-tight">
            Big Box Upsell Contest
          </h2>
          <p className="text-[11px] text-slate-400 mt-2">FL stores only · Jun 9–30</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            What's your name?
          </label>
          <div className="relative mb-4">
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => results?.length && setShowDropdown(true)}
              placeholder="Start typing your name…"
              autoFocus
              autoComplete="off"
              className="w-full bg-[#1a2635] border border-[#243044] rounded-lg px-4 py-3 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#F5831F]/60"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 animate-pulse">
                searching…
              </span>
            )}
            {showDropdown && results?.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a2635] border border-[#243044] rounded-lg overflow-hidden shadow-xl">
                {results.map((emp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#243044] transition-colors border-b border-slate-800/60 last:border-0"
                  >
                    <div className="text-[13px] text-slate-200 font-semibold">{emp.fullName}</div>
                    {emp.storeName && <div className="text-[10px] text-slate-500">{emp.storeName}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {results !== null && results.length === 0 && !selected && (
            <div className="mb-4 text-[11px] text-slate-500">
              Not a restaurant employee?{' '}
              <button
                type="button"
                onClick={() => onLogin({ name: name.trim(), storeId: null, storeName: ROLE_MAP[name.trim()] ?? name.trim(), dmName: null })}
                className="text-[#F5831F] underline underline-offset-2 hover:text-[#e07318] transition-colors"
              >
                Continue as {name.trim()}
              </button>
            </div>
          )}

          {selected?.storeName && (
            <div className="mb-4 text-[11px] font-semibold text-[#F5831F]">
              📍 {selected.storeName}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-lg bg-[#F5831F] text-white text-[13px] font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e07318] transition-colors"
          >
            Let's go!
          </button>
        </form>
      </div>
    </div>
  )
}

function CommentsSection({ allStores, isAdmin, homeStore }) {
  const [comments,     setComments]     = useState([])
  const [loadingC,     setLoadingC]     = useState(true)
  const [posting,      setPosting]      = useState(false)
  const [authorStore,  setAuthorStore]  = useState('')
  const [text,         setText]         = useState('')
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [postError,    setPostError]    = useState(null)

  useEffect(() => {
    if (homeStore && !authorStore) setAuthorStore(homeStore)
  }, [homeStore])

  function load() {
    supabase
      .from('upsell_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error) setComments(data ?? [])
        setLoadingC(false)
      })
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_097_152) { alert('Image must be under 2 MB'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!authorStore || !text.trim() || posting) return
    setPosting(true)
    setPostError(null)
    const raw  = localStorage.getItem('tice_user')
    const name = raw ? JSON.parse(raw)?.name : null
    const storeObj = allStores.find(s => s.locRef === authorStore)
    const dmName   = DM_MAP[Number(authorStore)] ?? null
    try {
      let image_url = null
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop()
        const path = `contest/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('contest-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        const { data: urlData } = supabase.storage.from('contest-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
      const { data: d, error: insertError } = await supabase
        .from('upsell_comments')
        .insert({
          store_name:  storeObj?.storeName ?? authorStore,
          dm_name:     dmName,
          message:     text.trim(),
          poster_name: name ?? null,
          image_url:   image_url ?? null,
        })
        .select()
        .single()
      if (insertError) throw new Error(insertError.message)
      localStorage.setItem('home_store', authorStore)
      setComments(prev => [d, ...prev].slice(0, 50))
      setText('')
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      setPostError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('upsell_comments').delete().eq('id', id)
    if (!error) setComments(prev => prev.filter(c => c.id !== id))
  }

  const charsLeft = 280 - text.length

  return (
    <div className="max-w-[1200px] mx-auto px-5 mb-10">
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3 flex items-center gap-2">
          <span className="text-base leading-none">🔥</span>
          <span className="text-[13px] font-bold uppercase tracking-widest text-slate-300">Contest Wall</span>
          <span className="text-[10px] text-slate-600 ml-auto">auto-refreshes every 60s</span>
        </div>
        <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
          {loadingC && <div className="px-5 py-6 text-center text-[11px] text-slate-500 animate-pulse">Loading comments…</div>}
          {!loadingC && comments.length === 0 && <div className="px-5 py-8 text-center text-[12px] text-slate-500">No team talk yet. Be the first. 💪</div>}
          {comments.map(c => (
            <div key={c.id} className="px-5 py-3">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[12px] font-bold text-[#F5831F]">{c.store_name}</span>
                {c.poster_name && !c.store_name?.includes(c.poster_name) && (
                  <span style={{color:'#9ca3af', fontSize:'0.8rem', marginLeft:'6px'}}>{c.poster_name}</span>
                )}
                <span className="text-[10px] text-slate-600 ml-auto tabular-nums">{relTime(c.created_at)}</span>
                {isAdmin && (
                  <button type="button" onClick={() => handleDelete(c.id)}
                    className="text-[11px] text-slate-700 hover:text-rose-400 transition-colors leading-none" title="Delete comment">
                    🗑️
                  </button>
                )}
              </div>
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap break-words leading-snug">{c.message}</p>
              {c.image_url && <img src={c.image_url} alt="" className="mt-2 rounded-lg max-w-[200px] object-cover" />}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 px-5 py-3 bg-slate-950/40">
          {postError && <div className="mb-2 text-[11px] text-rose-400">{postError}</div>}
          <form onSubmit={handleSubmit} className="flex gap-2 items-start">
            {homeStore ? (
              <span style={{color:'#F5831F', fontWeight:600}} className="flex-shrink-0 text-[11px] px-2.5 py-2 leading-5">
                {allStores.find(s => s.locRef === homeStore)?.storeName ?? `Store ${homeStore}`}
              </span>
            ) : (
              <select value={authorStore} onChange={e => setAuthorStore(e.target.value)}
                className="bg-[#1a2635] border border-[#243044] rounded-lg px-2.5 py-2 text-[11px] text-slate-300 cursor-pointer flex-shrink-0 w-36">
                <option value="">Your store…</option>
                <option value="ARL (Leadership)">ARL (Leadership)</option>
                {allStores.map(s => <option key={s.locRef} value={s.locRef}>{s.storeName}</option>)}
              </select>
            )}
            <div className="flex-1 relative">
              <textarea value={text} onChange={e => setText(e.target.value.slice(0, 280))}
                placeholder="Talk your game 🔥 (emoji welcome)" rows={2}
                className="w-full bg-[#1a2635] border border-[#243044] rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-[#F5831F]/60" />
              {charsLeft <= 80 && (
                <span className={`absolute bottom-2 right-2 text-[10px] tabular-nums ${charsLeft <= 20 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {charsLeft}
                </span>
              )}
            </div>
            <label className="flex-shrink-0 cursor-pointer">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base transition-colors ${imageFile ? 'border-[#F5831F] bg-[#F5831F]/10' : 'border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300'}`}>
                📷
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
            <button type="submit" disabled={posting || !authorStore || !text.trim()}
              className="flex-shrink-0 px-4 h-9 rounded-lg bg-[#F5831F] text-white text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e07318] transition-colors self-center">
              {posting ? '…' : 'Post'}
            </button>
          </form>
          {imagePreview && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imagePreview} alt="preview" className="h-14 rounded-md object-cover" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="text-[10px] text-slate-500 hover:text-slate-300">remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HallOfFame({ apiBase }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${apiBase}/api/upsell-hall-of-fame`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [apiBase])

  function fmtDate(s) {
    if (!s) return '—'
    return new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) return <div className="max-w-[1200px] mx-auto px-5 py-16 text-center text-[12px] text-slate-500 animate-pulse">Loading Hall of Fame…</div>
  if (error)   return <div className="max-w-[1200px] mx-auto px-5 py-8 text-center text-[12px] text-rose-400">{error}</div>
  if (!data?.top3?.length) return <div className="max-w-[1200px] mx-auto px-5 py-16 text-center text-[12px] text-slate-500">No records yet — contest starts Jun 9.</div>

  const [gold, silver, bronze] = data.top3
  const podium = [silver, gold, bronze].filter(Boolean)

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <div className="text-center mb-10">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#F5831F] mb-2">All-Time Best Single Day</div>
        <h2 className="text-[26px] font-black uppercase tracking-widest text-white leading-none">Hall of Fame</h2>
        <p className="text-[11px] text-slate-500 mt-2">Highest single-day attach rates since Jun 9 · min 10 checks</p>
      </div>
      <div className="flex items-end justify-center gap-4 max-w-2xl mx-auto">
        {podium.map(entry => {
          const rank       = entry === gold ? 1 : entry === silver ? 2 : 3
          const medal      = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
          const pedH       = rank === 1 ? 'h-24' : rank === 2 ? 'h-16' : 'h-10'
          const cardBorder = rank === 1 ? 'border-amber-400/60 bg-amber-900/15' : rank === 2 ? 'border-slate-400/30 bg-slate-800/20' : 'border-amber-700/40 bg-amber-950/15'
          const pedBg      = rank === 1 ? 'bg-amber-500/15 border-t border-x border-amber-500/30' : rank === 2 ? 'bg-slate-600/15 border-t border-x border-slate-500/30' : 'bg-amber-800/15 border-t border-x border-amber-700/30'
          return (
            <div key={`${entry.locRef}-${entry.busDt}`} className="flex flex-col items-center flex-1">
              <div className={`w-full rounded-xl border ${cardBorder} px-4 py-5 text-center`}>
                <div className="text-[32px] leading-none mb-3">{medal}</div>
                <div className="text-[13px] font-bold text-white leading-snug">{entry.storeName}</div>
                <div className={`text-[32px] font-black tabular-nums mt-2 leading-none ${attachColorClass(entry.attachRate)}`}>{entry.attachRate.toFixed(1)}%</div>
                <div className="text-[11px] text-slate-400 mt-2 font-semibold">{fmtDate(entry.busDt)}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{entry.upsellChecks}/{entry.totalChecks} checks</div>
              </div>
              <div className={`w-full ${pedH} ${pedBg} flex items-center justify-center`}>
                <span className="text-[11px] font-black text-slate-500">#{rank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const VIEWS = [
  { id: 'day',       label: 'TODAY',           rangeLabel: 'Today' },
  { id: 'yesterday', label: 'YESTERDAY',       rangeLabel: 'Yesterday' },
  { id: 'wtd',       label: 'WTD',             rangeLabel: 'Jun 8–' },
  { id: 'ptd',       label: 'PTD',             rangeLabel: 'Jun 1–' },
  { id: 'hof',       label: '🏆 Hall of Fame', rangeLabel: '' },
]

// apiBase: '' for same-origin apps, or full URL like 'https://tice-hub.vercel.app'
export function UpsellLeaderboard({ apiBase = '' }) {
  const [data,           setData]           = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [activeView,     setActiveView]     = useState('day')
  const [dmFilter,       setDmFilter]       = useState('all')
  const [storeSpotlight, setStoreSpotlight] = useState('all')
  const [isAdmin,        setIsAdmin]        = useState(false)
  const [ticeUser,       setTiceUser]       = useState(null)
  const [homeStore,      setHomeStore]      = useState('')

  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).get('admin') === 'true')
    try {
      const stored = localStorage.getItem('tice_user')
      const hs     = localStorage.getItem('home_store')
      if (stored) setTiceUser(JSON.parse(stored))
      if (hs)     { setHomeStore(hs); setStoreSpotlight(hs) }
    } catch {}
  }, [])

  function handleLogin({ name, storeId, storeName, dmName }) {
    const u = { name, storeId: storeId ?? null, storeName: storeName ?? null, dmName: dmName ?? null }
    localStorage.setItem('tice_user', JSON.stringify(u))
    if (storeId) {
      localStorage.setItem('home_store', storeId)
      setHomeStore(storeId)
      setStoreSpotlight(storeId)
    }
    try { posthog.identify(name, { storeId, storeName, dmName }) } catch {}
    setTiceUser(u)
  }

  function handleLogout() {
    localStorage.removeItem('tice_user')
    localStorage.removeItem('home_store')
    window.location.reload()
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${apiBase}/api/upsell-leaderboard`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [apiBase])

  const windowData = data?.[activeView] ?? null

  const displayStores = useMemo(() => {
    if (!windowData) return []
    if (dmFilter === 'all') return windowData.stores
    return windowData.stores
      .filter(s => s.dmName === dmFilter)
      .map((s, i) => ({ ...s, rank: i + 1 }))
  }, [windowData, dmFilter])

  const allStores = useMemo(() => {
    if (!data) return []
    const seen = new Map()
    for (const win of ['ptd', 'wtd', 'yesterday', 'day']) {
      for (const s of (data[win]?.stores ?? [])) {
        if (!seen.has(s.locRef)) seen.set(s.locRef, s.storeName)
      }
    }
    return [...seen.entries()]
      .map(([locRef, storeName]) => ({ locRef: String(locRef), storeName }))
      .sort((a, b) => a.storeName.localeCompare(b.storeName))
  }, [data])

  const spotlightStores = useMemo(() => {
    if (dmFilter === 'all') return allStores
    const dmLocRefs = new Set((DM_ALIGNMENT[dmFilter] ?? []).map(String))
    return allStores.filter(s => dmLocRefs.has(s.locRef))
  }, [allStores, dmFilter])

  const pinnedStore    = storeSpotlight !== 'all' ? displayStores.find(s => String(s.locRef) === storeSpotlight) ?? null : null
  const isHof          = activeView === 'hof'
  const visibleCount   = storeSpotlight !== 'all' ? (pinnedStore ? 1 : 0) : displayStores.length

  function handleStoreSelect(val) {
    setStoreSpotlight(val)
    if (val !== 'all') setDmFilter('all')
  }

  return (
    <div className="min-h-screen bg-[#0e1a2b] font-sans">

      {/* Header */}
      <div className="bg-[#070f1a] border-b border-slate-800/60 px-5 py-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[22px] font-black uppercase tracking-widest text-[#F5831F] leading-none">Big Box Upsell Contest</h1>
              <p className="text-[11px] text-slate-500 mt-1.5">Contest starts June 9 · FL stores only · attach rate = upsell checks ÷ total BB checks</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] font-semibold text-[#F5831F]">#TICEwakesuptoWIN</div>
              {data && <div className="text-[10px] text-slate-500 mt-1">Live · {data.asOf}</div>}
            </div>
          </div>
          {data && (
            <div className="flex gap-3">
              <KpiCard label="Today"     rate={data.day.flRate}       totalChecks={data.day.flTotalChecks}       range="FL fleet" />
              <KpiCard label="Yesterday" rate={data.yesterday.flRate} totalChecks={data.yesterday.flTotalChecks} range={data.yest} />
              <KpiCard label="WTD"       rate={data.wtd.flRate}       totalChecks={data.wtd.flTotalChecks}       range="Jun 8+" />
              <KpiCard label="PTD"       rate={data.ptd.flRate}       totalChecks={data.ptd.flTotalChecks}       range="Jun 1+" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-5 py-2.5">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
            {VIEWS.map(v => (
              <button key={v.id} type="button" onClick={() => setActiveView(v.id)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeView === v.id ? 'bg-[#F5831F] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {v.label}
              </button>
            ))}
          </div>
          <select value={dmFilter} onChange={e => { setDmFilter(e.target.value); setStoreSpotlight('all') }}
            className="bg-[#1a2635] border border-[#243044] rounded-lg px-3 py-1.5 text-[11px] text-slate-300 cursor-pointer">
            <option value="all">All DMs</option>
            {ALL_DMS.map(dm => <option key={dm} value={dm}>{dm}</option>)}
          </select>
          {ticeUser?.storeId && !isAdmin ? (
            <span className="bg-[#1a2635] border border-[#243044] rounded-lg px-3 py-1.5 text-[11px] text-slate-300">
              {ticeUser.storeName ?? pinnedStore?.storeName ?? `#${ticeUser.storeId}`}
              <span className="text-slate-500 ml-1">({ticeUser.storeId})</span>
            </span>
          ) : (
            <select value={storeSpotlight} onChange={e => handleStoreSelect(e.target.value)}
              className="bg-[#1a2635] border border-[#243044] rounded-lg px-3 py-1.5 text-[11px] text-slate-300 cursor-pointer">
              <option value="all">All Stores</option>
              {spotlightStores.map(s => <option key={s.locRef} value={s.locRef}>{s.storeName}</option>)}
            </select>
          )}
          {loading && <span className="text-[10px] text-slate-500 animate-pulse">Loading…</span>}
          {windowData && (
            <span className="text-[10px] text-slate-500 tabular-nums ml-auto">
              {visibleCount} store{visibleCount !== 1 ? 's' : ''}
              {dmFilter !== 'all' && ` · ${dmFilter}`}
              {storeSpotlight !== 'all' && ` · #${storeSpotlight} spotlit`}
            </span>
          )}
          {ticeUser && (
            <span className="text-[11px] text-slate-400 ml-2">
              Hi {ticeUser.name} 👋{' '}
              <button type="button" onClick={handleLogout}
                className="text-slate-600 hover:text-slate-300 underline underline-offset-2 transition-colors">
                Not you?
              </button>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-[1200px] mx-auto mt-3 px-5">
          <div className="bg-rose-950/50 border border-rose-800/50 rounded-lg px-4 py-2.5 text-rose-400 text-[11px]">{error}</div>
        </div>
      )}

      {loading && !data && (
        <div className="max-w-[1200px] mx-auto mt-4 px-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 h-[200px] animate-pulse opacity-40" />
        </div>
      )}

      {isHof && <HallOfFame apiBase={apiBase} />}

      {!isHof && (
        <div className="max-w-[1200px] mx-auto mt-4 px-5">
          {!pinnedStore ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-center text-[12px] text-slate-500">
              Select your store above to see your ranking
            </div>
          ) : (
            <div className="rounded-xl border border-[#F5831F]/40 bg-slate-900 px-6 py-5" style={{ borderLeft: '4px solid #F5831F' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#F5831F] mb-3">📍 Your Store</div>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Rank</div>
                  <div className="flex items-baseline gap-2">
                    {pinnedStore.rank <= 3
                      ? <span className="text-4xl leading-none"><RankCell rank={pinnedStore.rank} /></span>
                      : <span className="text-[36px] font-black text-white tabular-nums leading-none">#{pinnedStore.rank}</span>}
                    <span className="text-[11px] text-slate-500">of {displayStores.length}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Store</div>
                  <div className="text-[18px] font-bold text-white leading-tight">{pinnedStore.storeName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pinnedStore.dmName} · #{pinnedStore.locRef}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Attach Rate</div>
                  <div className={`text-[36px] font-black tabular-nums leading-none ${attachColorClass(pinnedStore.upsellPct)}`}>{fmtPct(pinnedStore.upsellPct)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">BB Checks</div>
                  <div className="text-[22px] font-bold text-slate-300 tabular-nums leading-none">{fmtN(pinnedStore.totalChecks)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Upsell Checks</div>
                  <div className="text-[22px] font-bold text-slate-300 tabular-nums leading-none">{fmtN(pinnedStore.upsellChecks)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isHof && displayStores.length > 0 && (
        <div className="max-w-[1200px] mx-auto mt-4 px-5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Stores</div>
          <div className="flex gap-3">
            {displayStores.slice(0, 3).map(s => (
              <div key={s.locRef} className={`flex-1 rounded-xl border bg-slate-900 px-4 py-4 ${s.rank === 1 ? 'border-amber-500/50 bg-amber-900/10' : s.rank === 2 ? 'border-slate-500/40 bg-slate-800/20' : 'border-amber-800/30 bg-amber-950/10'}`}>
                <div className="text-2xl mb-2 leading-none"><RankCell rank={s.rank} /></div>
                <div className="text-[13px] font-bold text-white leading-tight">{s.storeName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{dmFirst(s.dmName)} · #{s.locRef}</div>
                <div className={`text-[22px] font-black tabular-nums mt-2 leading-none ${attachColorClass(s.upsellPct)}`}>{fmtPct(s.upsellPct)}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{fmtN(s.upsellChecks)} upsell / {fmtN(s.totalChecks)} BB</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHof && !loading && windowData && displayStores.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">No upsell data for this window.</div>
      )}

      {!isHof && (
        <div className="mt-4">
          <CommentsSection allStores={allStores} isAdmin={isAdmin} homeStore={homeStore} />
        </div>
      )}

      {!isHof && displayStores.length > 0 && (
        <div className="max-w-[1200px] mx-auto mt-4 mb-8 px-5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Full Leaderboard</div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/60">
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-14">Rank</th>
                  <th className="px-4 py-3 text-left   text-[10px] font-semibold uppercase tracking-widest text-slate-400">Store</th>
                  <th className="px-4 py-3 text-left   text-[10px] font-semibold uppercase tracking-widest text-slate-400">DM</th>
                  <th className="px-4 py-3 text-right  text-[10px] font-semibold uppercase tracking-widest text-slate-400">Upsell %</th>
                  <th className="px-4 py-3 text-right  text-[10px] font-semibold uppercase tracking-widest text-slate-400">Big Box Checks</th>
                  <th className="px-4 py-3 text-right  text-[10px] font-semibold uppercase tracking-widest text-slate-400">Upsell Checks</th>
                </tr>
              </thead>
              <tbody>
                {displayStores.map(store => {
                  const isSpotlit    = pinnedStore && String(store.locRef) === storeSpotlight
                  const rowHighlight = store.rank === 1 ? 'bg-amber-900/25 border-amber-800/40' : store.rank === 2 ? 'bg-slate-700/25 border-slate-600/40' : store.rank === 3 ? 'bg-amber-950/15 border-slate-700/40' : ''
                  return (
                    <tr key={store.locRef} id={`store-row-${store.locRef}`}
                      className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/20 ${rowHighlight}`}
                      style={isSpotlit ? { borderLeft: '3px solid #F5831F', background: 'rgba(245,131,31,0.08)' } : undefined}>
                      <td className="px-4 py-3 text-center"><RankCell rank={store.rank} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-semibold ${store.rank === 1 ? 'text-white' : 'text-slate-200'}`}>{store.storeName}</span>
                        <span className="text-[10px] text-slate-600 ml-1.5">#{store.locRef}</span>
                        {isSpotlit && <span className="ml-2 text-[9px] font-bold text-[#F5831F]">📍</span>}
                      </td>
                      <td className="px-4 py-3"><span className="text-[12px] text-slate-400">{dmFirst(store.dmName)}</span></td>
                      <td className="px-4 py-3 text-right"><span className={`text-[15px] tabular-nums ${attachColorClass(store.upsellPct)}`}>{fmtPct(store.upsellPct)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-[13px] text-slate-300 tabular-nums">{fmtN(store.totalChecks)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-[13px] text-slate-300 tabular-nums">{fmtN(store.upsellChecks)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-slate-600">
            <span><span className="text-emerald-400">■</span> ≥20% — on target</span>
            <span><span className="text-amber-400">■</span> 10–19% — developing</span>
            <span><span className="text-rose-400">■</span> &lt;10% — needs focus</span>
          </div>
        </div>
      )}

      {!ticeUser && <LoginModal onLogin={handleLogin} apiBase={apiBase} />}
    </div>
  )
}

export default UpsellLeaderboard
