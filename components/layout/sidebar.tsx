"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Briefcase, Receipt, Settings, Users, LogOut, Plus, ChevronDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspaces", label: "Workspaces", icon: Briefcase },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/members", label: "Members", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace()

  const handleSwitchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((ws) => ws.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen">
      {/* Logo / Workspace Switcher */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="font-bold text-sidebar-foreground mb-4">WorkSphere</div>

        {currentWorkspace && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
              >
                <span className="truncate text-sm">{currentWorkspace.name}</span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {workspaces.map((ws) => (
                <DropdownMenuItem key={ws.id} className="text-sm" onClick={() => handleSwitchWorkspace(ws.id)}>
                  {ws.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="text-primary" onClick={() => router.push("/workspaces")}>
                <Plus className="w-4 h-4 mr-2" />
                Manage workspaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Avatar className="w-6 h-6 mr-3">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm flex-1 text-left">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
