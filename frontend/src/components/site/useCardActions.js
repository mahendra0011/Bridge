import { useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useDispatch } from 'react-redux'
import { toggleSaved } from '@/store'

export function useCardActions(kind) {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const handleSave = useCallback((item) => {
    if (!user) {
      toast.error('Log in to save roles')
      return
    }
    const key = `${kind}:${item.id}`
    dispatch(toggleSaved({ id: item.id, kind, company: item.company, title: item.title }))
    api.post('/api/student/saved', { posting: item.id, postingType: kind })
      .catch(() => {
        dispatch(toggleSaved(key))
        toast.error('Could not save — try again')
      })
  }, [user, kind, dispatch])

  const handleUnsave = useCallback((item) => {
    const key = `${kind}:${item.id}`
    dispatch(toggleSaved(key))
    api.delete(`/api/student/saved/${item.id}`)
      .catch(() => {
        dispatch(toggleSaved(key))
        toast.error('Could not remove — try again')
      })
  }, [kind, dispatch])

  return { handleSave, handleUnsave }
}