import { createContext } from 'react'

export const AuthContext = createContext({ session: undefined, error: '' })
