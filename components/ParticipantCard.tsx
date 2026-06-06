'use client'

import { motion } from 'framer-motion'
import { Participant } from '@/types'

interface Props {
  participant: Participant
  rank: number
  onClick: () => void
}

export function ParticipantCard({ participant, rank, onClick }: Props) {
  const isSpinning = participant.is_spinning
  const hasCountry = !!participant.country_id

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-all ${
        isSpinning
          ? 'spinning-card bg-gradient-to-r from-orange-950/40 to-yellow-950/30'
          : hasCountry
          ? 'glass-card card-hover-glow'
          : 'glass-card card-hover-glow cursor-pointer'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4">
        {/* Rank / Number */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isSpinning
            ? 'bg-orange-500 text-white'
            : hasCountry
            ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
            : 'bg-white/5 text-gray-500 border border-white/10'
        }`}>
          {isSpinning ? '🎡' : rank}
        </div>

        {/* Participant Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-base truncate ${isSpinning ? 'text-orange-300' : 'text-white'}`}>
              {participant.name}
            </span>
            {isSpinning && (
              <motion.span
                className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                🔥 LIVE DRAW
              </motion.span>
            )}
          </div>

          {hasCountry && participant.country ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">{participant.country.flag}</span>
              <span className="text-[#FFD700] font-medium text-sm">{participant.country.name}</span>
              <span className="text-xs text-gray-600 ml-auto">🔒 Terkunci</span>
            </div>
          ) : isSpinning ? (
            <div className="flex items-center gap-1 mt-0.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
              <span className="text-orange-400 text-xs ml-1">Sedang mengundi...</span>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-0.5">Belum diundi — tap untuk undi</p>
          )}
        </div>

        {/* Arrow or Lock */}
        <div className="flex-shrink-0">
          {hasCountry ? (
            <div className="text-2xl">{participant.country?.flag}</div>
          ) : isSpinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-xl"
            >
              🎡
            </motion.div>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  )
}
