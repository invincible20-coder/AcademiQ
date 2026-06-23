# AcademIQ — AI-Powered Academic Operating System

## Monorepo Structure
```
academiq/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── prompts/      # Agent prompt library
└── infrastructure/   # Docker, CI/CD
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker Desktop

### 1. Install dependencies
```bash
npm install
pip install -r apps/api/requirements.txt
```

### 2. Configure environment
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Fill in your keys
```

### 3. Start local services
```bash
docker-compose -f infrastructure/docker-compose.yml up -d
```

### 4. Run development servers
```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Shadcn/UI |
| State | Zustand, TanStack Query |
| Backend | FastAPI, Python 3.12 |
| AI Agents | LangGraph, OpenAI, Groq, Anthropic |
| Database | PostgreSQL (Supabase) |
| Vector DB | Qdrant |
| Auth | Clerk |
| Cache | Redis (Upstash) |
| Storage | Cloudflare R2 / AWS S3 |
