import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setSaved } from '@/store'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// Keeps the Redux `saved` slice in sync with the backend so OpportunityCard's
// bookmark icon reflects the student's actual saved state across the app.
export function SavedSync() {
  const { user } = useAuth()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user || user.role !== 'student') {
      dispatch(setSaved([]))
      return
    }
    api
      .get('/api/student/saved')
      .then((data) => {
        const jobKeys = (data.savedJobs || []).map((j) => `job:${j._id}`)
        const internshipKeys = (data.savedInternships || []).map((i) => `internship:${i._id}`)
        dispatch(setSaved([...jobKeys, ...internshipKeys]))
      })
      .catch(() => {})
  }, [user, dispatch])

  return null
}
