import { createContext, useContext } from 'react'

export const GuruSessionContext = createContext({ sessionBadge: null })
export const useGuruSession = () => useContext(GuruSessionContext)
