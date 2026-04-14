import { createContext, useContext } from 'react'

export const StudentContext = createContext()
export const useStudent = () => useContext(StudentContext)
