"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PublicNote {
  id: string
  title: string
  content: string
  createdAt: string
  user: { email: string }
}

export default function PublicNotePage() {
  const params = useParams()
  const noteId = params.id as string
  const [note, setNote] = useState<PublicNote | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/notes/public/${noteId}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error?.message || "Note not found")
          return
        }
        
        setNote(data.note)
        // Update page title
        document.title = data.note.title
      } catch (e) {
        setError("Failed to load note")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (noteId) {
      fetchNote()
    }
  }, [noteId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error || "Note not found"}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This note may be private or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{note.title}</CardTitle>
            <CardDescription>
              by {note.user.email} · {new Date(note.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {note.content}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-8">
          Shared via WorkSphere
        </p>
      </div>
    </div>
  )
}
