import { configureStore, createSlice } from '@reduxjs/toolkit'

// Saved items are keyed as "kind:id" (e.g. "job:64f...") since internship and
// job documents live in separate Mongo collections and can share ObjectId
// values in theory — keying by kind avoids any collision.
const savedSlice = createSlice({
  name: 'saved',
  initialState: { ids: [] },
  reducers: {
    toggleSaved(state, action) {
      const key = action.payload
      if (state.ids.includes(key)) {
        state.ids = state.ids.filter((i) => i !== key)
      } else {
        state.ids.push(key)
      }
    },
    setSaved(state, action) {
      state.ids = action.payload
    },
  },
})

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: { applied: [] },
  reducers: {
    applyToJob(state, action) {
      if (!state.applied.includes(action.payload)) {
        state.applied.push(action.payload)
      }
    },
    setApplied(state, action) {
      state.applied = action.payload
    },
  },
})

export const { toggleSaved, setSaved } = savedSlice.actions
export const { applyToJob, setApplied } = applicationsSlice.actions

export const store = configureStore({
  reducer: {
    saved: savedSlice.reducer,
    applications: applicationsSlice.reducer,
  },
})
