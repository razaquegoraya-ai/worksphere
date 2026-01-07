# WorkSphere

A modern workspace management application built with Next.js and Hono.

## Features

- **Workspaces** - Create and manage multiple workspaces
- **Team Members** - Invite and manage team members with role-based access (Owner, Admin, Member, Viewer)
- **Notes** - Create, edit, and share notes with visibility controls (Private, Members, Public)
- **Expenses** - Track workspace expenses
- **Public Sharing** - Share public notes via URL without requiring login

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TailwindCSS
- shadcn/ui components
- TypeScript

### Backend
- Hono (Node.js)
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/razaquegoraya-ai/worksphere.git
cd worksphere
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database URL and JWT secret:
```
DATABASE_URL="postgresql://user:password@localhost:5432/worksphere"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

4. Run database migrations
```bash
pnpm prisma:migrate
pnpm prisma:generate
```

5. Start the development servers

Backend:
```bash
pnpm server:dev
```

Frontend (in another terminal):
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── (protected)/       # Authenticated routes
│   └── public/            # Public routes (no auth)
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API client
├── prisma/                # Prisma schema and migrations
└── server/                # Hono backend
    └── src/
        ├── routes/        # API routes
        ├── middlewares/   # Auth and workspace middlewares
        └── utils/         # Utility functions
```

## API Endpoints

### Auth
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login

### Workspaces
- `GET /workspaces` - List user's workspaces
- `POST /workspaces` - Create workspace

### Members
- `GET /members` - List workspace members
- `POST /members/invite` - Invite member
- `POST /members/decision` - Approve/reject member
- `DELETE /members/:userId` - Remove member

### Notes
- `GET /notes` - List notes
- `POST /notes` - Create note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `GET /public/notes/:id` - View public note (no auth)

### Expenses
- `GET /expenses` - List expenses
- `POST /expenses` - Create expense

## License

MIT
