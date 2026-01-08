<!-- markdownlint-disable MD040 -->

# WorkSphere - Full Application Flow

This document explains the complete flow of the Notes feature, database design decisions, and permission system.

## How a note is created

```
User clicks "New Note" → Frontend Form → API Request → Database → Response → UI Update
```

### 1. Frontend (User Interface)

**File:** `app/(protected)/notes/page.tsx`

```tsx
const handleCreate = async () => {
  if (!title.trim() || !content.trim()) return
  await createNote({ title, content, visibility })
  // Reset form and close dialog
}
```

### 2. Context Layer

**File:** `contexts/notes-context.tsx`

The `createNote` function calls the API client:

```tsx
const createNote = async (payload: { title: string; content: string; visibility?: NoteVisibility }) => {
  const { note } = await api.createNote(payload)
  setNotes((prev) => [mapNote(note), ...prev])
  return mapNote(note)
}
```

### 3. API Client

**File:** `lib/api/client.ts`

Sends HTTP request with:

- **Authorization header:** JWT token for authentication
- **x-workspace-id header:** Current workspace context
- **Body:** Note data (title, content, visibility)

```typescript
createNote: async (payload) =>
  request<{ note: Note }>('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
    workspace: true  // Adds x-workspace-id header
  })
```

### 4. API Route (Server)

**File:** `app/api/notes/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Verify user authentication
  const user = await verifyAuth(request)
  if (!user) return jsonError('UNAUTHENTICATED', '...', 401)

  // 2. Verify workspace membership
  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) return jsonError('NO_WORKSPACE', '...', 400)

  // 3. Validate input
  const parsed = createNoteSchema.safeParse(body)

  // 4. Create note in database
  const note = await prisma.note.create({
    data: {
      title,
      content,
      visibility,
      userId: user.id,           // Owner of the note
      workspaceId: wsContext.workspace.id,
    }
  })

  // 5. Log audit trail
  await logAudit({ action: 'NOTE_CREATE', ... })

  // 6. Return created note
  return Response.json({ note }, { status: 201 })
}
```

### 5. Database Storage

**Prisma Schema:**

```prisma
model Note {
  id          String         @id @default(cuid())
  workspaceId String
  userId      String
  title       String
  content     String
  visibility  NoteVisibility @default(PRIVATE)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?

  workspace   Workspace      @relation(fields: [workspaceId], references: [id])
  user        User           @relation(fields: [userId], references: [id])
}
```

---

## How Public/Private Logic Works

### We have three Visibility Levels

`PRIVATE`  -> Only the note creator -> Personal notes, drafts
`MEMBERS`  -> All workspace members -> Team documentation, meeting notes
`PUBLIC`   -> Anyone with the link  -> Shared resources, public documentation

### How Visibility is Enforced

**File:** `app/api/notes/route.ts` (GET handler)

```typescript
const notes = await prisma.note.findMany({
  where: {
    workspaceId: wsContext.workspace.id,
    deletedAt: null,
    OR: [
      { visibility: 'PUBLIC' },                     // Anyone can see public notes
      { visibility: 'MEMBERS' },                    // All members can see
      { visibility: 'PRIVATE', userId: user.id },   // Only owner sees private
    ],
  },
})
```

## How Shared Notes Work

### Public Note Sharing

#### 1. Creating a Public Note

When a user sets visibility to `PUBLIC`, the note becomes accessible via a unique URL.

#### 2. Getting the Share URL

**File:** `app/(protected)/notes/page.tsx`

```tsx
const getPublicUrl = (noteId: string) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/public/notes/${noteId}`
}
```

The UI displays this URL only for PUBLIC notes:

```tsx
{selectedNote.visibility === "PUBLIC" && (
  <div className="pt-4 border-t">
    <Label>Public Share Link</Label>
    <Input readOnly value={getPublicUrl(selectedNote.id)} />
    <Button onClick={() => copyPublicUrl(selectedNote.id)}>
      <Copy /> Copy
    </Button>
  </div>
)}
```

#### 3. Public Access (No Authentication Required)

**File:** `app/api/notes/public/[id]/route.ts`

```typescript
export async function GET(request, { params }) {
  const { id: noteId } = await params

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id, title, content, visibility, createdAt, user: { email } }
  })

  // CRITICAL: Only return if visibility is PUBLIC
  if (!note || note.visibility !== 'PUBLIC') {
    return Response.json({ error: 'Note not found or not public' }, { status: 404 })
  }

  return Response.json({ note })
}
```

#### 4. Public View Page

**File:** `app/public/notes/[id]/page.tsx`

- No authentication required
- Fetches note from `/api/notes/public/{id}`
- Displays note content in a clean, read-only format
- Updates browser tab title to note title

### Members-Only Sharing

For `MEMBERS` visibility:

1. User must be logged in
2. User must be an **APPROVED** member of the workspace
3. The note appears in their notes list automatically

```typescript
// Workspace membership check
const membership = await prisma.workspaceMember.findUnique({
  where: { userId_workspaceId: { userId, workspaceId } }
})

if (membership.status !== 'APPROVED') {
  return jsonError('FORBIDDEN', 'Membership not approved', 403)
}
```

---

## Database Structure

### Why This Structure?

#### 1. **User-Workspace-Note Relationship**

```
User (1) ──────┬────── (*) WorkspaceMember (*)  ──────┬────── (1) Workspace
               │                                      │
               │                                      │
               └──────────── (*) Note (*) ────────────┘
```

**Reasoning:**
- A user can belong to multiple workspaces
- A workspace can have multiple members
- Notes are scoped to both a user (creator) AND a workspace
- This allows workspace-level access control while tracking ownership

#### 2. **WorkspaceMember as Join Table**

```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  userId      String
  workspaceId String
  role        Role     @default(MEMBER)
  status      Status   @default(PENDING)

  @@unique([userId, workspaceId])  // One membership per user per workspace
}
```

**Why not just store role on User?**

- A user can have different roles in different workspaces
- Status (PENDING/APPROVED/REJECTED) tracks invitation flow
- Enables invitation workflow before granting access

#### 3. **Soft Deletes**

```prisma
model Note {
  deletedAt DateTime?  // null = active, timestamp = deleted
}
```

**Benefits:**

- Data recovery possible
- Audit trail preserved
- No cascading delete issues
- Can implement "trash" feature

#### 4. **Visibility Enum**

```prisma
enum NoteVisibility {
  PUBLIC
  PRIVATE
  MEMBERS
}
```

**Why enum instead of boolean?**

- Extensible (can add more levels like `WORKSPACE_ADMINS`)
- Self-documenting
- Database-level constraint
- Type safety in application code

### Entity Relationship Diagram

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────┐
│     User     │       │  WorkspaceMember  │       │  Workspace   │
├──────────────┤       ├───────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)           │    ┌──│ id (PK)      │
│ email        │  │    │ userId (FK)    ───│────┘  │ name         │
│ passwordHash │  └────│ workspaceId (FK)  │───────│ ownerId (FK) │
│ createdAt    │       │ role              │       │ createdAt    │
└──────────────┘       │ status            │       │ deletedAt    │
       │               └───────────────────┘       └──────────────┘
       │                                                  │
       │               ┌───────────────────┐              │
       │               │       Note        │              │
       │               ├───────────────────┤              │
       └───────────────│ userId (FK)       │              │
                       │ workspaceId (FK)  │──────────────┘
                       │ title             │
                       │ content           │
                       │ visibility        │
                       │ createdAt         │
                       │ deletedAt         │
                       └───────────────────┘
```

## How Permissions are checked

### Role Hierarchy

```typescript
const roleRank: Record<Role, number> = {
  OWNER: 4,   // Full control
  ADMIN: 3,   // Can manage members, all content
  MEMBER: 2,  // Can create/edit own content
  VIEWER: 1,  // Read-only access
}
```

### Permission Functions

**File:** `lib/server/permissions.ts`

```typescript
// Check if role meets minimum requirement
export function hasAtLeast(role: Role, required: Role) {
  return roleRank[role] >= roleRank[required]
}

// Can approve/reject member invitations
export function canApprove(role: Role) {
  return role === 'OWNER' || role === 'ADMIN'
}

// Can remove a member (with hierarchy check)
export function canRemove(role: Role, targetRole: Role) {
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return targetRole !== 'OWNER'  // Admin can't remove owner
  return false
}
```

### Permission Checks in API Routes

#### 1. Authentication Check

```typescript
const user = await verifyAuth(request)
if (!user) {
  return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
}
```

#### 2. Workspace Membership Check

```typescript
const wsContext = await verifyWorkspace(request, user.id)
if (!wsContext) {
  return jsonError('NO_WORKSPACE', 'Active workspace not provided', 400)
}
```

#### 3. Role-Based Check

```typescript
if (wsContext.role === 'VIEWER') {
  return jsonError('FORBIDDEN', 'Insufficient role', 403)
}
```

#### 4. Ownership Check (for notes)

```typescript
if (existing.userId !== user.id) {
  return jsonError('FORBIDDEN', 'Only the owner can update this note', 403)
}
```

## What happes if a user tries to access a note they should'nt

### Scenario 1: Unauthenticated User Tries to Access Protected Route

**Request:** `GET /api/notes` (no Authorization header)

**Response:**

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Missing or invalid authorization"
  }
}
```

**HTTP Status:** 401

**Frontend Handling:**

- Redirects to `/login` page
- Shows "Please log in to continue"

### Scenario 2: User Tries to Access Note in Wrong Workspace

**Request:** `GET /api/notes/abc123` with `x-workspace-id: different-workspace`

**Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Note not found"
  }
}
```

**HTTP Status:** 404

**Why 404 instead of 403?**

- Security best practice: Don't reveal that the note exists
- Prevents enumeration attacks
- User can't distinguish between "doesn't exist" and "no access"

### Scenario 3: User Tries to Access Private Note of Another User

**Code Path:**

```typescript
// In GET /api/notes/:id
if (note.visibility === 'PRIVATE' && note.userId !== user.id) {
  return jsonError('FORBIDDEN', 'Access denied', 403)
}
```

**Response:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

**HTTP Status:** 403

### Scenario 4: User Tries to Edit Another User's Note

**Code Path:**

```typescript
// In PUT /api/notes/:id
if (existing.userId !== user.id) {
  return jsonError('FORBIDDEN', 'Only the owner can update this note', 403)
}
```

**Response:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the owner can update this note"
  }
}
```

**HTTP Status:** 403

### Scenario 5: Non-Public Note Accessed via Public URL

**Request:** `GET /api/notes/public/abc123` (note is PRIVATE or MEMBERS)

**Code Path:**

```typescript
if (!note || note.visibility !== 'PUBLIC') {
  return Response.json(
    { error: { code: 'NOT_FOUND', message: 'Note not found or not public' } },
    { status: 404 }
  )
}
```

**Frontend Display:**

```tsx
<Card>
  <CardContent>
    <p className="text-destructive">Note not found</p>
    <p>This note may be private or doesn't exist.</p>
  </CardContent>
</Card>
```

### Scenario 6: Pending Member Tries to Access Workspace

**Code Path:**

```typescript
// In verifyWorkspace()
if (membership.status !== 'APPROVED') {
  return null  // Treated as no access
}
```

**Response:**

```json
{
  "error": {
    "code": "NO_WORKSPACE",
    "message": "Active workspace not provided or not accessible"
  }
}
```

**HTTP Status:** 400

---

## Summary

The WorkSphere notes system implements a **defense-in-depth** approach:

1. **Authentication Layer** - JWT tokens verify user identity
2. **Workspace Layer** - Membership status gates workspace access
3. **Role Layer** - Permissions vary by role (OWNER > ADMIN > MEMBER > VIEWER)
4. **Ownership Layer** - Only note creators can edit/delete their notes
5. **Visibility Layer** - PUBLIC/PRIVATE/MEMBERS controls read access

This multi-layered approach ensures that even if one check fails, others prevent unauthorized access.
