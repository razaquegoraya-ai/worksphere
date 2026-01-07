"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import type { Expense } from "@/lib/types"
import { api } from "@/lib/api/client"

interface ExpensesContextType {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
}

export const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])

  // helpers to map between backend and UI Expense shapes
  const fromBackend = (e: { id: string; workspaceId: string; userId: string; title: string; amountCents: number; currency: string; occurredAt: string; createdAt: string }) : Expense => ({
    id: e.id,
    workspaceId: e.workspaceId,
    category: e.title,
    amount: e.amountCents / 100,
    description: "",
    date: e.occurredAt.split("T")[0],
    createdBy: e.userId,
    createdAt: e.createdAt,
  })

  const toBackendCreate = (e: Expense) => ({
    title: e.category,
    amountCents: Math.round(e.amount * 100),
    currency: 'USD',
    occurredAt: new Date(e.date).toISOString(),
  })

  const toBackendUpdate = (patch: Partial<Expense>) => {
    const out: any = {}
    if (patch.category !== undefined) out.title = patch.category
    if (patch.amount !== undefined) out.amountCents = Math.round(patch.amount * 100)
    if (patch.date !== undefined) out.occurredAt = new Date(patch.date).toISOString()
    return out
  }

  // initial load
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.listExpenses()
        setExpenses(res.expenses.map(fromBackend))
      } catch (_) {}
    })()
  }, [])

  const addExpense = useCallback(async (expense: Expense) => {
    const created = await api.createExpense(toBackendCreate(expense))
    setExpenses((prev) => [...prev, fromBackend(created.expense)])
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    // optimistic remove
    setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    try { await api.deleteExpense(id) } catch { /* on failure we could reload */ }
  }, [])

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const res = await api.updateExpense(id, toBackendUpdate(updates))
    const mapped = fromBackend(res.expense)
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? mapped : exp)))
  }, [])

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense }}>
      {children}
    </ExpensesContext.Provider>
  )
}
