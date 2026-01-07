"use client"

import { useContext, useState } from "react"
import { NotesContext, type Note, type NoteVisibility } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Eye, Lock, Users, RefreshCw, Pencil, Link, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

function visibilityIcon(v: NoteVisibility) {
  switch (v) {
    case "PUBLIC":
      return <Eye className="w-3 h-3" />
    case "PRIVATE":
      return <Lock className="w-3 h-3" />
    case "MEMBERS":
      return <Users className="w-3 h-3" />
  }
}

function visibilityLabel(v: NoteVisibility) {
  switch (v) {
    case "PUBLIC":
      return "Public"
    case "PRIVATE":
      return "Private"
    case "MEMBERS":
      return "Members Only"
  }
}

export default function NotesPage() {
  const ctx = useContext(NotesContext)
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<NoteVisibility>("PRIVATE")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editVisibility, setEditVisibility] = useState<NoteVisibility>("PRIVATE")
  const [copied, setCopied] = useState(false)

  if (!ctx) return <div className="p-8">Loading...</div>

  const { notes, isLoading, createNote, deleteNote, updateNote, refreshNotes } = ctx

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    await createNote({ title, content, visibility })
    setTitle("")
    setContent("")
    setVisibility("PRIVATE")
    setIsCreateOpen(false)
  }

  const handleDelete = async (id: string) => {
    await deleteNote(id)
    if (selectedNote?.id === id) setSelectedNote(null)
  }

  const openEditDialog = (note: Note) => {
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditVisibility(note.visibility)
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedNote || !editTitle.trim() || !editContent.trim()) return
    const updated = await updateNote(selectedNote.id, { 
      title: editTitle, 
      content: editContent, 
      visibility: editVisibility 
    })
    setSelectedNote(updated)
    setIsEditOpen(false)
  }

  const getPublicUrl = (noteId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/public/notes/${noteId}`
  }

  const copyPublicUrl = async (noteId: string) => {
    const url = getPublicUrl(noteId)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Write and share notes with your workspace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshNotes} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>Write a new note and set its visibility.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" placeholder="Write your note..." rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as NoteVisibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Private (only you)
                      </div>
                    </SelectItem>
                    <SelectItem value="MEMBERS">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Members (workspace members)
                      </div>
                    </SelectItem>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Public (anyone)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No notes yet. Create your first note!
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Notes list */}
          <div className="space-y-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedNote(note)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{note.title}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      {visibilityIcon(note.visibility)}
                      {visibilityLabel(note.visibility)}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    by {note.user?.email || "Unknown"} · {new Date(note.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected note view */}
          <div>
            {selectedNote ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedNote.title}</CardTitle>
                      <CardDescription>
                        by {selectedNote.user?.email || "Unknown"} · {new Date(selectedNote.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {visibilityIcon(selectedNote.visibility)}
                        {visibilityLabel(selectedNote.visibility)}
                      </Badge>
                      {user?.id === selectedNote.userId && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(selectedNote)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedNote.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {selectedNote.content}
                  </div>
                  
                  {selectedNote.visibility === "PUBLIC" && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Link className="w-3 h-3" /> Public Share Link
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={getPublicUrl(selectedNote.id)} 
                          className="text-xs bg-muted"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyPublicUrl(selectedNote.id)}
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Anyone with this link can view this note
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a note to view its content
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update your note details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" placeholder="Note title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea id="edit-content" placeholder="Write your note..." rows={6} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as NoteVisibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Private (only you)
                    </div>
                  </SelectItem>
                  <SelectItem value="MEMBERS">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Members (workspace members)
                    </div>
                  </SelectItem>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Public (anyone)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editTitle.trim() || !editContent.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
