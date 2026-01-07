"use client"

import type React from "react"

import { AppLayout } from "@/components/layout/app-layout"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { ExpensesProvider } from "@/contexts/expenses-context"
import { MembersProvider } from "@/contexts/members-context"
import { NotesProvider } from "@/contexts/notes-context"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <ExpensesProvider>
        <MembersProvider>
          <NotesProvider>
            <AppLayout>{children}</AppLayout>
          </NotesProvider>
        </MembersProvider>
      </ExpensesProvider>
    </WorkspaceProvider>
  )
}
