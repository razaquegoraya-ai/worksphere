"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteForm } from "@/components/members/invite-form"
import { MemberList } from "@/components/members/member-list"

export default function MembersPage() {
  const [showInviteForm, setShowInviteForm] = useState(false)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to your workspace</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          {showInviteForm ? "Cancel" : "Invite Member"}
        </button>
      </div>

      {showInviteForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>Send an invitation to join your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm
              onSuccess={() => {
                setShowInviteForm(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      <MemberList />
    </div>
  )
}
