'use client'

import { motion } from 'framer-motion'
import { Participant } from '@/types'

interface Props {
  participant: Participant
}

export function LiveDrawBanner({ participant }: Props) {
  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="mx-4 mb-4 max-w-2xl mx-auto"
    >
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-950/60 via-yellow-950/40 to-orange-950/60">
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/5 to-orange-500/10"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Pulsing dot */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-orange-300 font-bold text-sm">🔥 LIVE DRAW</span>
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">LIVE</span>
            </div>
            <p className="text-white text-sm">
              <span className="font-bold">{participant.name}</span>
              <span className="text-gray-300"> sedang mengundi negara...</span>
            </p>
          </div>

          {/* Spin indicator */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="text-2xl flex-shrink-0"
          >
            🎡
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
