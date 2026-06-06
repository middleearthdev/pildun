'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Participant } from '@/types'

interface Props {
  onClose: () => void
  onAdded: (participant: Participant) => void
}

export function AddParticipantModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal menambah peserta')
        return
      }

      onAdded(data.participant)
    } catch {
      setError('Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-sm"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="glass-card rounded-t-3xl sm:rounded-3xl p-6 border border-white/10">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5 sm:hidden" />

          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span>👤</span> Tambah Peserta
          </h2>
          <p className="text-gray-400 text-sm mb-5">Masukkan nama peserta arisan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nama Peserta</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="contoh: Fahmi"
                autoFocus
                maxLength={50}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/8 transition-all"
              />
              {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 py-3 rounded-xl font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}
