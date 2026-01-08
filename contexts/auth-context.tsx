"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import type { User } from "@/lib/types"
import { api } from "@/lib/api/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('ws_token')
    const storedUser = localStorage.getItem('ws_user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        // Invalid stored user, clear it
        localStorage.removeItem('ws_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Clear any stale auth first
      api.logout()
      const res = await api.login(email, password)
      const userData = { id: res.user.id, email: res.user.email, name: res.user.email.split("@")[0] }
      setUser(userData)
      localStorage.setItem('ws_user', JSON.stringify(userData))
      // Fetch workspaces and set the first one as active
      const wsRes = await api.listWorkspaces()
      if (wsRes.workspaces.length > 0) {
        localStorage.setItem('ws_active_workspace_id', wsRes.workspaces[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      api.logout()
      const res = await api.signup(email, password, name)
      const userData = { id: res.user.id, email: res.user.email, name }
      setUser(userData)
      localStorage.setItem('ws_user', JSON.stringify(userData))
    } finally {
      setIsLoading(false)
    }
  }, [])


  const logout = useCallback(() => {
    api.logout()
    localStorage.removeItem('ws_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
