"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExpenses } from "@/hooks/use-expenses"
import { useWorkspace } from "@/hooks/use-workspace"
import { useAuth } from "@/hooks/use-auth"
import type { Expense } from "@/lib/types"

const categories = ["Office Supplies", "Meals", "Travel", "Software", "Equipment", "Other"]

interface ExpenseFormProps {
  onSuccess?: () => void
  expense?: Expense
}

export function ExpenseForm({ onSuccess, expense }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useExpenses()
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()

  const [category, setCategory] = useState(expense?.category || "")
  const [amount, setAmount] = useState(expense?.amount.toString() || "")
  const [description, setDescription] = useState(expense?.description || "")
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!category || !amount || !description || !date) {
      setError("Please fill in all fields")
      return
    }

    if (!currentWorkspace || !user) {
      setError("Workspace or user not found")
      return
    }

    try {
      setIsLoading(true)

      if (expense) {
        updateExpense(expense.id, {
          category,
          amount: Number.parseFloat(amount),
          description,
          date,
        })
      } else {
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          workspaceId: currentWorkspace.id,
          category,
          amount: Number.parseFloat(amount),
          description,
          date,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
        }
        addExpense(newExpense)
      }

      setCategory("")
      setAmount("")
      setDescription("")
      setDate(new Date().toISOString().split("T")[0])
      onSuccess?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading} />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
      </Button>
    </form>
  )
}
