"use client"

import { useContext } from "react"
import { MembersContext } from "@/contexts/members-context"

export const useMembers = () => {
  const context = useContext(MembersContext)
  if (!context) {
    throw new Error("useMembers must be used within MembersProvider")
  }
  return context
}
