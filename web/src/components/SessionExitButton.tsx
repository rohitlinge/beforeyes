import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { closeRoom } from '@/features/lobby/api'
import type { Room } from '@/features/lobby/types'

type SessionExitButtonProps = {
  room: Room | null | undefined
  uid: string | undefined
  className?: string
  label?: string
}

export function SessionExitButton({
  room,
  uid,
  className,
  label = 'Exit Session',
}: SessionExitButtonProps) {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const waitingAlone =
    room?.status === 'waiting_partner' && !room.partnerB
  const isHost = Boolean(room && uid && room.createdBy === uid)
  const canClose = Boolean(room && uid && room.memberIds.includes(uid))

  const title = waitingAlone && isHost ? 'Cancel this room?' : 'Leave this session?'
  const description = waitingAlone && isHost
    ? 'The invite link will stop working. You can always create a new room.'
    : room?.status === 'result_revealed' || room?.status === 'closed'
      ? 'You’ll return home. This room stays in your history.'
      : 'Your partner may be mid-flow. The room will close for both of you.'

  async function confirm() {
    if (!room || !uid || !canClose) {
      navigate('/app')
      return
    }

    if (room.status === 'closed' || room.status === 'result_revealed') {
      setOpen(false)
      navigate('/app')
      return
    }

    setBusy(true)
    try {
      await closeRoom({ roomId: room.roomId, uid })
      pushToast(
        waitingAlone && isHost ? 'Room cancelled.' : 'Session closed.',
        'success',
      )
      navigate('/app')
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : 'Could not close the room.',
        'error',
      )
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant/60 px-4 py-2 font-label text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
        }
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          logout
        </span>
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={waitingAlone && isHost ? 'Cancel room' : 'Leave session'}
        cancelLabel="Stay"
        danger
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
      />
    </>
  )
}
