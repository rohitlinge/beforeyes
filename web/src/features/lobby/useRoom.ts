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
    // #region agent log
    fetch('http://127.0.0.1:7370/ingest/ac5c11ac-0645-4a28-afc5-a7c1935a705a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'518cb8'},body:JSON.stringify({sessionId:'518cb8',runId:'post-fix-3',hypothesisId:'G',location:'useRoom.ts:subscribe',message:'subscribeRoom start',data:{roomId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const unsub = subscribeRoom(
      roomId,
      (next) => {
        // #region agent log
        fetch('http://127.0.0.1:7370/ingest/ac5c11ac-0645-4a28-afc5-a7c1935a705a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'518cb8'},body:JSON.stringify({sessionId:'518cb8',runId:'post-fix-3',hypothesisId:'G',location:'useRoom.ts:snapshot',message:'subscribeRoom data',data:{roomId,hasRoom:Boolean(next),status:next?.status??null,partnerB:Boolean(next?.partnerB)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setRoom(next)
        setLoading(false)
      },
      (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7370/ingest/ac5c11ac-0645-4a28-afc5-a7c1935a705a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'518cb8'},body:JSON.stringify({sessionId:'518cb8',runId:'post-fix-3',hypothesisId:'G',location:'useRoom.ts:error',message:'subscribeRoom error',data:{roomId,error:err.message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
