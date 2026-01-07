"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { ExpenseList } from "@/components/expenses/expense-list"

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          {showForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
            <CardDescription>Record a new business expense</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              onSuccess={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <ExpenseList onEdit={(id) => setEditingId(id)} />
    </div>
  )
}
