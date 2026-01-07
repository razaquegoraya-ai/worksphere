"use client"

import { Crown, Trash2, MoreVertical, RefreshCw, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMembers } from "@/hooks/use-members"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MemberList() {
  const { members, removeMember, approveMember, refreshMembers, isLoading } = useMembers()
  const { user } = useAuth()

  const isOwner = members.some((mem) => mem.userId === user?.id && mem.role === "owner")

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No members yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this workspace</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshMembers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.user?.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{member.user?.name[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{member.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "owner" && <Crown className="w-4 h-4 text-primary" />}
                  <span className="text-xs font-medium text-muted-foreground capitalize">{member.role}</span>
                  {member.status === "PENDING" && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                  )}
                  {member.status === "APPROVED" && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" /> Approved
                    </Badge>
                  )}
                </div>
              </div>

              {isOwner && member.userId !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.status === "PENDING" && (
                      <DropdownMenuItem onClick={() => approveMember(member.userId)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => removeMember(member.userId)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
