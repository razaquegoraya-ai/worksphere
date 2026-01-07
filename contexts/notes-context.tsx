"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import { api } from "@/lib/api/client"

export type NoteVisibility = "PUBLIC" | "PRIVATE" | "MEMBERS"

export interface Note {
  id: string
  title: string
  content: string
  visibility: NoteVisibility
  userId: string
  createdAt: string
  updatedAt: string
  user?: { id: string; email: string }
}

interface NotesContextType {
  notes: Note[]
  isLoading: boolean
  refreshNotes: () => Promise<void>
  createNote: (note: { title: string; content: string; visibility?: NoteVisibility }) => Promise<Note>
  updateNote: (id: string, patch: { title?: string; content?: string; visibility?: NoteVisibility }) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.listNotes()
      setNotes(res.notes as Note[])
    } catch (e) {
      // silently fail; user may not have workspace selected yet
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNotes()
  }, [refreshNotes])

  const createNote = useCallback(async (payload: { title: string; content: string; visibility?: NoteVisibility }) => {
    const res = await api.createNote(payload)
    const newNote = res.note as Note
    setNotes((prev) => [newNote, ...prev])
    return newNote
  }, [])

  const updateNote = useCallback(async (id: string, patch: { title?: string; content?: string; visibility?: NoteVisibility }) => {
    const res = await api.updateNote(id, patch)
    const updated = res.note as Note
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
    return updated
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    await api.deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotesContext.Provider value={{ notes, isLoading, refreshNotes, createNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  )
}
