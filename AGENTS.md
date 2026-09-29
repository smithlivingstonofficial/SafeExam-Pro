<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SafeExam Pro — Workspace Rules

## Project Context
This is **SafeExam Pro**, a secure exam platform for a **single university**. There is NO multi-tenancy. The platform includes an admin dashboard, exam engine, proctoring system, and (in Phase 5) an Electron-based lockdown browser.

## Tech Stack
- **Framework**: Next.js 14+ with App Router (`src/app`)
- **Backend/BaaS**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Hosting**: Vercel
- **CDN/Security**: Cloudflare
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Validation**: Zod (always validate API inputs)
- **State**: Zustand (client-side), React Server Components (server-side)

## Mandatory Patterns
1. **Single-university**: There is NO multi-tenancy. No `org_id`. No tenant isolation. One instance = one university.
2. **Light Theme Only**: Always keep the site in an elegant, high-contrast, clean modern light theme (crisp white/slate surfaces, slate-900 text, refined royal blue/indigo accents). Do NOT use dark theme.
3. **RBAC**: 5 roles — `admin`, `examiner`, `proctor`, `candidate`, `viewer`. RLS policies are role-based.
4. **Audit Logging**: Every mutating operation MUST write to `audit_logs`.
5. **Input Validation**: Every API route handler MUST validate input with Zod before processing.
6. **Error Handling**: Use consistent error response format: `{ error: string, code: string, details?: any }`.
7. **TypeScript**: Strict mode. No `any` types. All Supabase queries must use generated types.
8. **Server Components**: Default to Server Components. Use `"use client"` only when React hooks or browser APIs are needed.
9. **Security**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use RLS for data access control.
10. **Auth Method**: Email and Password authentication ONLY. No OAuth, Magic Links, or third-party identity providers.

## Code Style
- Files and folders: `kebab-case`
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Database: `snake_case`
- Constants/Env vars: `SCREAMING_SNAKE_CASE`

