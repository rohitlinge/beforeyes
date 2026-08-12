import { useEffect, useState } from 'react'
import { subscribeRoom, subscribeUserRooms } from '@/features/lobby/api'
import type { Room } from '@/features/lobby/types'
import { isFirebaseConfigured } from '@/lib/firebase'

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId || !isFirebaseConfigured) {
      setRoom(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeRoom(
      roomId,
      (next) => {
        setRoom(next)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return unsub
  }, [roomId])

  return { room, loading, error }
}

export function useUserRooms(uid: string | undefined) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid || !isFirebaseConfigured) {
      setRooms([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeUserRooms(
      uid,
      (next) => {
        setRooms(next)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [uid])

  return { rooms, loading, error }
}
