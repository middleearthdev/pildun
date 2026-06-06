'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Participant } from '@/types'
import { ParticipantCard } from './ParticipantCard'
import { AddParticipantModal } from './AddParticipantModal'
import { LockedModal } from './LockedModal'
import { LiveDrawBanner } from './LiveDrawBanner'

interface Props {
  initialParticipants: Participant[]
}

export function ParticipantList({ initialParticipants }: Props) {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [showAddModal, setShowAddModal] = useState(false)
  const [lockedParticipant, setLockedParticipant] = useState<Participant | null>(null)

  const fetchParticipants = useCallback(async () => {
    const res = await fetch('/api/participants')
    const data = await res.json()
    if (data.participants) setParticipants(data.participants)
  }, [])

  useEffect(() => {
    // Subscribe to realtime postgres changes
    const channel = supabase
      .channel('participants-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchParticipants])

  const spinningParticipant = participants.find(p => p.is_spinning)

  // Sort: spinning participant first, then by created_at
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_spinning && !b.is_spinning) return -1
    if (!a.is_spinning && b.is_spinning) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const handleParticipantClick = (participant: Participant) => {
    if (participant.country_id) {
      setLockedParticipant(participant)
    } else {
      router.push(`/spin/${participant.id}`)
    }
  }

  const handleParticipantAdded = (newParticipant: Participant) => {
    setParticipants(prev => [...prev, newParticipant])
    setShowAddModal(false)
  }

  const totalAssigned = participants.filter(p => p.country_id).length
  const totalParticipants = participants.length

  return (
    <>
      {/* Live Draw Banner */}
      <AnimatePresence>
        {spinningParticipant && (
          <LiveDrawBanner participant={spinningParticipant} />
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-center gap-6 py-2 px-4 glass-card rounded-full max-w-xs mx-auto">
          <div className="text-center">
            <div className="text-[#00D4FF] font-bold text-lg">{totalParticipants}</div>
            <div className="text-gray-500 text-xs">Peserta</div>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <div className="text-[#FFD700] font-bold text-lg">{totalAssigned}</div>
            <div className="text-gray-500 text-xs">Sudah Diundi</div>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">{totalParticipants - totalAssigned}</div>
            <div className="text-gray-500 text-xs">Belum Diundi</div>
          </div>
        </div>
      </div>

      {/* Participant Cards */}
      <div className="px-4 max-w-2xl mx-auto">
        {participants.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-400 text-lg">Belum ada peserta</p>
            <p className="text-gray-600 text-sm mt-1">Tambahkan peserta untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sortedParticipants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ParticipantCard
                    participant={participant}
                    rank={index + 1}
                    onClick={() => handleParticipantClick(participant)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB - Add Participant */}
      <motion.button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-6 z-40 flex items-center gap-2 px-5 py-4 rounded-full font-bold text-white shadow-2xl btn-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260 }}
      >
        <span className="text-xl">+</span>
        <span className="text-sm">Tambah Peserta</span>
      </motion.button>

      {/* Add Participant Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddParticipantModal
            onClose={() => setShowAddModal(false)}
            onAdded={handleParticipantAdded}
          />
        )}
      </AnimatePresence>

      {/* Locked Modal */}
      <AnimatePresence>
        {lockedParticipant && (
          <LockedModal
            participant={lockedParticipant}
            onClose={() => setLockedParticipant(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
