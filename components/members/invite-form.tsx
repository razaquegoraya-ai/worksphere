"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMembers } from "@/hooks/use-members"

interface InviteFormProps {
  onSuccess?: () => void
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const { inviteMember } = useMembers()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    try {
      setIsLoading(true)
      await inviteMember(email, role)
      setEmail("")
      setRole("member")
      setSuccess(true)
      onSuccess?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value: any) => setRole(value)}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {success && <div className="text-sm text-green-600">Member invited successfully!</div>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Sending invite..." : "Send Invite"}
      </Button>
    </form>
  )
}
