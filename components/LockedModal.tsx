'use client'

import { motion } from 'framer-motion'
import { Participant } from '@/types'

interface Props {
  participant: Participant
  onClose: () => void
}

export function LockedModal({ participant, onClose }: Props) {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="glass-card rounded-3xl p-6 border border-white/10 text-center">
          <div className="w-14 h-14 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFD700]/30">
            <span className="text-2xl">🔒</span>
          </div>

          <h3 className="text-lg font-bold text-white mb-1">Negara Sudah Terkunci</h3>
          <p className="text-gray-400 text-sm mb-5">{participant.name} sudah mendapatkan:</p>

          <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-2xl p-4 mb-5">
            <div className="text-5xl mb-2">{participant.country?.flag}</div>
            <div className="text-[#FFD700] font-bold text-xl">{participant.country?.name}</div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white btn-primary"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </>
  )
}
