"use client"

import { Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExpenses } from "@/hooks/use-expenses"
import { useWorkspace } from "@/hooks/use-workspace"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpenseListProps {
  onEdit?: (expenseId: string) => void
}

export function ExpenseList({ onEdit }: ExpenseListProps) {
  const { expenses, deleteExpense } = useExpenses()
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()

  const workspaceExpenses = expenses.filter((exp) => exp.workspaceId === currentWorkspace?.id)
  const totalAmount = workspaceExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (workspaceExpenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No expenses yet. Create your first one!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaceExpenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalAmount / workspaceExpenses.length).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaceExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-2">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2">{expense.category}</td>
                    <td className="py-3 px-2 text-muted-foreground">{expense.description}</td>
                    <td className="py-3 px-2 text-right font-medium">${expense.amount.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit?.(expense.id)}
                        disabled={user?.id !== expense.createdBy}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteExpense(expense.id)}
                        disabled={user?.id !== expense.createdBy}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
