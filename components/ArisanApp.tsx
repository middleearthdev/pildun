'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SpinWheel } from './SpinWheel'
import * as Confetti from '@/lib/confetti'
import * as Sound from '@/lib/sounds'
import { Participant, Country } from '@/types'

interface Props {
  initialParticipants: Participant[]
  initialCountries: Country[]
  drawStartAt: string | null
}

function formatDrawStart(date: Date) {
  return date.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ---- Practice-mode banner (shown before the official draw start time) ----
function PracticeBanner({ startAt }: { startAt: Date }) {
  return (
    <div className="practice-banner">
      <span className="practice-banner-icon">🛠️</span>
      <div>
        <b>Mode latihan</b> — undian resmi mulai <b>{formatDrawStart(startAt)}</b>.
        Sebelum itu kamu boleh coba-coba putar rodanya, tapi negara yang keluar
        <b> tidak akan disimpan</b>.
      </div>
    </div>
  )
}

// ---- Avatar with initials ----
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase()
}
function hueFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}
function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const h = hueFor(name)
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(145deg, hsl(${h} 70% 42%), hsl(${(h + 40) % 360} 75% 32%))`,
      }}
    >
      {initials(name)}
    </div>
  )
}

// ---- Live bar ----
function LiveBar({ spinningName }: { spinningName: string | null }) {
  return (
    <div className={`livebar${spinningName ? ' active' : ''}`}>
      <span className="dot" />
      {spinningName
        ? <span><b>{spinningName}</b> sedang mengundi negara…</span>
        : <span>Live Draw Room • <b>terhubung</b></span>
      }
    </div>
  )
}

// ---- Participant card ----
function ParticipantCard({ p, country, isSpinning, onClick }: {
  p: Participant; country: Country | null; isSpinning: boolean; onClick: () => void
}) {
  return (
    <button
      className={`pcard${isSpinning ? ' spinning' : ''}${country ? ' locked' : ''}`}
      onClick={onClick}
    >
      {isSpinning && <span className="live-tag">🎡 SEDANG MENGUNDI</span>}
      <Avatar name={p.name} />
      <div className="pcard-body">
        <div className="pcard-name">{p.name}</div>
        {isSpinning ? (
          <div className="pcard-status live">🔥 Live draw berlangsung…</div>
        ) : country ? (
          <div className="pcard-country">
            <span className="pcard-flag">{country.flag}</span>
            <span>{country.name}</span>
            <span className="lock-ico" title="Terkunci">🔒</span>
          </div>
        ) : (
          <div className="pcard-status">Belum diundi</div>
        )}
      </div>
      <span className="pcard-arrow">{country ? '✓' : '›'}</span>
    </button>
  )
}

// ---- Modals ----
function Backdrop({ children, onClose, blur }: { children: React.ReactNode; onClose?: () => void; blur?: boolean }) {
  return (
    <div className={`backdrop${blur ? ' heavy' : ''}`} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function AddParticipantModal({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true)
    onAdd(name.trim())
  }
  return (
    <Backdrop onClose={onClose}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-kicker">PESERTA BARU</div>
        <h2 className="modal-title">Tambah Peserta</h2>
        <p className="modal-sub">Masukkan nama peserta arisan. Langsung tampil ke semua layar.</p>
        <input
          ref={ref}
          className="field"
          placeholder="Nama peserta…"
          value={name}
          maxLength={24}
          onChange={e => setName(e.target.value)}
        />
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn primary" disabled={!name.trim() || loading}>
            {loading ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </Backdrop>
  )
}

function CountriesModal({ countries, onClose }: { countries: Country[]; onClose: () => void }) {
  return (
    <Backdrop onClose={onClose}>
      <div className="modal countries-modal">
        <div className="modal-kicker">BELUM DIUNDI</div>
        <h2 className="modal-title">Negara Tersisa</h2>
        <p className="modal-sub">{countries.length} negara masih menunggu untuk diundi.</p>
        <div className="country-list">
          {countries.map(c => (
            <div key={c.id} className="country-item">
              <span className="country-flag">{c.flag}</span>
              <span className="country-name">{c.name}</span>
            </div>
          ))}
        </div>
        <div className="modal-actions single">
          <button className="btn primary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </Backdrop>
  )
}

function LockedModal({ participant, country, onClose }: { participant: Participant; country: Country; onClose: () => void }) {
  return (
    <Backdrop onClose={onClose}>
      <div className="modal center">
        <div className="big-flag">{country.flag}</div>
        <div className="modal-kicker gold">NEGARA SUDAH TERKUNCI 🔒</div>
        <h2 className="modal-title">{participant.name} sudah dapat</h2>
        <div className="locked-country">{country.flag} {country.name}</div>
        <p className="modal-sub">Setiap peserta hanya bisa mengundi satu kali. Negara tidak bisa diganti.</p>
        <div className="modal-actions single">
          <button className="btn primary" onClick={onClose}>Mengerti</button>
        </div>
      </div>
    </Backdrop>
  )
}

function ConfirmSpinModal({ participant, remaining, onConfirm, onClose }: {
  participant: Participant; remaining: number; onConfirm: () => void; onClose: () => void
}) {
  return (
    <Backdrop onClose={onClose}>
      <div className="modal center">
        <div className="modal-emoji">🔥</div>
        <div className="modal-kicker">SIAP MENGUNDI?</div>
        <h2 className="modal-title">{participant.name}, giliranmu!</h2>
        <p className="modal-sub">
          Begitu tombol spin ditekan, negara yang keluar <b>langsung jadi milikmu</b> dan
          tidak bisa diganti. Tersisa <b>{remaining} negara</b> di putaran.
        </p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Batal</button>
          <button className="btn primary glow" onClick={onConfirm}>GASSS! 🚀</button>
        </div>
      </div>
    </Backdrop>
  )
}

function WinModal({ participant, country, practice, onClose }: { participant: Participant; country: Country; practice: boolean; onClose: () => void }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 30)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="winscreen">
      <div className="win-rays" />
      <div className={`win-inner${show ? ' in' : ''}`}>
        <div className="win-kicker">{practice ? '🛠️ LATIHAN 🛠️' : '🎉 SELAMAT 🎉'}</div>
        <div className="win-name">{participant.name} mendapatkan</div>
        <div className="win-flag">{country.flag}</div>
        <div className="win-country">{country.name.toUpperCase()}</div>
        {practice && (
          <p className="win-practice-note">
            Ini cuma percobaan — hasilnya <b>tidak disimpan</b>. Saat undian resmi dimulai, coba lagi ya!
          </p>
        )}
        <button className="btn primary big" onClick={onClose}>Lanjut →</button>
      </div>
    </div>
  )
}

// ---- Toast ----
type ToastState =
  | { kind: 'win'; name: string; flag: string; country: string }
  | { kind: 'wait'; name: string }
  | null

// ---- Modal state ----
type ModalState =
  | { type: 'add' }
  | { type: 'confirm'; p: Participant }
  | { type: 'locked'; p: Participant; country: Country }
  | { type: 'countries' }
  | null

const SPIN_SECONDS = 7.5
const SPIN_TURNS = 9

export function ArisanApp({ initialParticipants, initialCountries, drawStartAt }: Props) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [countries] = useState<Country[]>(initialCountries)
  const [view, setView] = useState<'list' | 'spin'>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [win, setWin] = useState<{ participant: Participant; country: Country; practice: boolean } | null>(null)
  const [spinPool, setSpinPool] = useState<Country[]>([])
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const rotationRef = useRef(0)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevParticipantsRef = useRef<Participant[]>(initialParticipants)

  // ---- Draw schedule: keep "now" fresh so the practice banner clears itself
  // automatically the moment the official draw time arrives ----
  const startAt = useMemo(() => (drawStartAt ? new Date(drawStartAt) : null), [drawStartAt])
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!startAt) return
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [startAt])
  const drawStarted = !startAt || now.getTime() >= startAt.getTime()

  const byId = useMemo(
    () => Object.fromEntries(countries.map(c => [c.id, c])),
    [countries]
  )

  const assignedIds = useMemo(
    () => new Set(participants.filter(p => p.country_id).map(p => p.country_id)),
    [participants]
  )

  const available = useMemo(
    () => countries.filter(c => !assignedIds.has(c.id)),
    [countries, assignedIds]
  )

  const active = participants.find(p => p.id === activeId)
  const spinningParticipant = participants.find(p => p.is_spinning && p.id !== activeId)

  const fetchParticipants = useCallback(async () => {
    const res = await fetch('/api/participants')
    const data = await res.json()
    if (data.participants) {
      const prev = prevParticipantsRef.current
      const next = data.participants as Participant[]

      // fire toast only when spin finishes (is_spinning: true → false), not when country first assigned
      next.forEach(np => {
        if (np.country_id && !np.is_spinning && np.id !== activeId) {
          const old = prev.find(p => p.id === np.id)
          if (old && old.is_spinning && np.country) {
            flashToast({ kind: 'win', name: np.name, flag: np.country.flag, country: np.country.name }, 3600)
          }
        }
      })

      prevParticipantsRef.current = next
      setParticipants(next)
    }
  }, [activeId])

  function flashToast(t: NonNullable<ToastState>, ms: number) {
    setToast(t)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), ms)
  }

  // Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('arisan-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        fetchParticipants()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchParticipants])

  // sort: spinning first → undrawn → drawn
  const ordered = useMemo(() => {
    const score = (p: Participant) => {
      if (p.is_spinning) return 0
      if (!p.country_id) return 1
      return 2
    }
    return [...participants].sort((a, b) => score(a) - score(b))
  }, [participants])

  function onCardClick(p: Participant) {
    if (p.is_spinning) return
    if (p.country_id) {
      const c = (p.country || byId[p.country_id]) as Country | null
      if (c) setModal({ type: 'locked', p, country: c })
    } else if (spinningParticipant) {
      flashToast({ kind: 'wait', name: spinningParticipant.name }, 2200)
    } else {
      setModal({ type: 'confirm', p })
    }
  }

  function startSpinFlow(p: Participant) {
    if (spinningParticipant) { setModal(null); flashToast({ kind: 'wait', name: spinningParticipant.name }, 2200); return }
    setModal(null)
    setActiveId(p.id)
    setSpinPool(available)
    setSpinning(false)
    setView('spin')
  }

  async function doSpin() {
    if (spinning || spinPool.length === 0 || !activeId || !active) return

    const n = spinPool.length
    const seg = 360 / n

    const res = await fetch('/api/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: activeId }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Terjadi kesalahan'); return }

    const winner: Country = data.country
    const practice: boolean = !!data.practice
    const idx = spinPool.findIndex(c => c.id === winner.id)
    const safeIdx = idx >= 0 ? idx : Math.floor(Math.random() * n)
    const center = safeIdx * seg + seg / 2
    const jitter = (Math.random() - 0.5) * seg * 0.6
    const base = Math.ceil((rotationRef.current + 1) / 360) * 360
    const target = base + 360 * SPIN_TURNS + (360 - center) + jitter

    setSpinning(true)
    setRotation(target)
    rotationRef.current = target

    Confetti.startRain({ intensity: 1, colors: ['#38bdf8', '#fbbf24', '#f0f9ff'] })
    Sound.startSpinTicks(SPIN_SECONDS * 1000)

    setTimeout(async () => {
      Sound.stopSpinTicks()
      Confetti.stopRain()
      Confetti.burst({
        intensity: 1.4,
        colors: ['#38bdf8', '#fbbf24', '#f0f9ff', '#22d3ee'],
        origins: [
          { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4 },
          { x: window.innerWidth * 0.2, y: window.innerHeight * 0.5 },
          { x: window.innerWidth * 0.8, y: window.innerHeight * 0.5 },
        ],
      })
      Sound.playWin()
      setWin({ participant: active, country: winner, practice })
      setSpinning(false)
      // Mode latihan: tidak ada apa pun yang disimpan di server, jadi tidak
      // perlu (dan tidak boleh) memanggil endpoint finish.
      if (!practice) {
        await fetch('/api/draw/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId: activeId }),
        })
      }
    }, SPIN_SECONDS * 1000 + 250)
  }

  function closeWin() {
    setWin(null)
    setActiveId(null)
    setView('list')
  }

  async function addParticipant(name: string) {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (res.ok && data.participant) setParticipants(prev => [...prev, data.participant])
    setModal(null)
  }

  const drawnCount = participants.filter(p => p.country_id).length

  return (
    <div className="app">
      {/* ===== LIST VIEW ===== */}
      {view === 'list' && (
        <div className="screen list">
          <header className="hero">
            <div className="hero-badges">
              <span className="badge">FIFA WORLD CUP</span>
              <span className="badge gold">2026</span>
            </div>
            <h1 className="hero-title">ARISAN<br /><span>PIALA DUNIA</span></h1>
            <p className="hero-sub">Pilih peserta lalu undi negara secara realtime.</p>
            {!drawStarted && startAt && <PracticeBanner startAt={startAt} />}
            <LiveBar spinningName={spinningParticipant?.name ?? null} />
            <div className="stats">
              <div className="stat"><b>{participants.length}</b><span>Peserta</span></div>
              <div className="stat"><b>{drawnCount}</b><span>Sudah diundi</span></div>
              <button className="stat clickable" onClick={() => setModal({ type: 'countries' })}>
                <b>{available.length}</b><span>Negara tersisa</span>
              </button>
            </div>
          </header>

          <div className="plist">
            {ordered.map(p => (
              <ParticipantCard
                key={p.id}
                p={p}
                country={p.country_id ? ((p.country || byId[p.country_id]) as Country | null) : null}
                isSpinning={p.is_spinning}
                onClick={() => onCardClick(p)}
              />
            ))}
          </div>

          <button className="fab" onClick={() => setModal({ type: 'add' })}>
            <span className="fab-plus">＋</span> Tambah Peserta
          </button>
          <div className="foot">Live Draw Room • {participants.length} peserta terhubung</div>
        </div>
      )}

      {/* ===== LIVE TOAST ===== */}
      {toast && (
        <div className={`toast ${toast.kind}`}>
          {toast.kind === 'win'
            ? <span><span className="toast-flag">{toast.flag}</span> <b>{toast.name}</b> baru saja dapat <b>{toast.country}</b>!</span>
            : <span>⏳ Sabar ya — <b>{toast.name}</b> lagi mengundi…</span>
          }
        </div>
      )}

      {/* ===== SPIN VIEW ===== */}
      {view === 'spin' && active && (
        <div className={`screen spin${spinning ? ' is-spinning' : ''}`}>
          <button
            className="back"
            onClick={() => { if (!spinning) { setView('list'); setActiveId(null) } }}
            disabled={spinning}
          >
            ‹ Kembali
          </button>

          <div className="spin-head">
            <div className="spin-kicker">{spinning ? '🎡 MENGUNDI…' : 'GILIRAN'}</div>
            <h2 className="spin-name">
              <Avatar name={active.name} size={40} />
              {active.name}
            </h2>
            <p className="spin-meta">
              {spinPool.length} negara siap diundi • setiap negara hanya bisa keluar sekali
            </p>
          </div>

          <SpinWheel
            countries={spinPool}
            rotation={rotation}
            duration={SPIN_SECONDS * 1000}
            spinning={spinning}
          />

          <button
            className={`spin-btn${spinning ? ' busy' : ''}`}
            onClick={doSpin}
            disabled={spinning}
          >
            {spinning ? 'BERPUTAR…' : 'PUTAR RODA 🎡'}
          </button>

          {spinning && (
            <div className="spin-hint">
              Semua layar lain melihat <b>{active.name}</b> sedang mengundi…
            </div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal?.type === 'countries' && (
        <CountriesModal countries={available} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'add' && (
        <AddParticipantModal onAdd={addParticipant} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'locked' && (
        <LockedModal participant={modal.p} country={modal.country} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'confirm' && (
        <ConfirmSpinModal
          participant={modal.p}
          remaining={available.length}
          onConfirm={() => startSpinFlow(modal.p)}
          onClose={() => setModal(null)}
        />
      )}
      {win && (
        <WinModal participant={win.participant} country={win.country} practice={win.practice} onClose={closeWin} />
      )}
    </div>
  )
}
