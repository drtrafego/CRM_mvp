# PROJECT CONTEXT: CRM SaaS B2B (Kanban Edition)

## Project Overview
We are building a modern B2B SaaS CRM for lead management with a focus on a **Kanban Board** visualization (Trello/Jira style). The goal is to provide a "Clean SaaS" experience with optimistic UI updates, customizable workflows, and performance tracking.

## Tech Stack
- **Framework:** Next.js 16.0.4 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui, Radix UI
- **Icons:** Lucide React
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Database:** Neon (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Stack Auth (Stack-auth.com)
- **Validation:** Zod
- **Table View:** TanStack Table

## UI/UX Guidelines
- **Style:** "Clean SaaS". Minimalist, high whitespace, Inter/Sans typography.
- **Palette:** White/Slate-50 background. Subtle borders (`border-slate-200`).
- **Interaction:** Optimistic UI updates for drag-and-drop, loading states for async actions.
- **Views:** Toggle between Kanban Board and List View.

## Folder Structure (`/src`)
```
/src
  /app
    /(dashboard)           # Protected routes
      /crm                 # Main CRM Page (Board/List wrapper)
        page.tsx
        loading.tsx
      /settings            # Settings Page (Webhooks, Company Info)
  /components
    /ui                    # Shadcn Components
    /layout                # Sidebar (crm-sidebar.tsx), Header
    /features
      /crm                 # CRM Specific Components
        crm-view.tsx       # View Switcher & Stats
        leads-list.tsx     # List/Table View
      /kanban              # Kanban Logic
        board.tsx          # DndContext & Drag Logic
        column.tsx         # Sortable Column
        lead-card.tsx      # Draggable Card
        new-lead-dialog.tsx
        edit-lead-dialog.tsx
  /lib
    db.ts                  # Drizzle + Neon connection
    utils.ts               # cn() helper
  /server
    /actions               # Server Actions (leads.ts, settings.ts)
    /db                    # Drizzle Schemas (schema.ts)
  /types                   # Global Types
```

## Database Schema

### `leads`
- `id` (uuid, pk)
- `name` (text)
- `company` (text)
- `email` (text)
- `phone` (text)
- `value` (decimal) - Lead Value
- `notes` (text)
- `status` (text)
- `columnId` (uuid, fk) - Linked to `columns`
- `position` (int) - For sorting
- `organizationId` (text)
- `createdAt` (timestamp)

### `columns`
- `id` (uuid, pk)
- `title` (text)
- `order` (int)
- `organizationId` (text)
- `color` (text)

### `settings`
- `id` (uuid, pk)
- `organizationId` (text, unique)
- `companyName` (text)

## Current Status (Completed)
- [x] **Core Infrastructure:** Next.js 16, Drizzle, Neon, Stack Auth.
- [x] **Kanban Board:** Drag-and-drop columns and cards with optimistic updates.
- [x] **Column Management:** Create, Rename, and Delete columns (with safety checks).
- [x] **Lead Management:** Add, Edit, and Move leads.
- [x] **Views:** Switch between Kanban Board and List View.
- [x] **List View:** Tabular data display with totals and status badges.
- [x] **Search & Filter:** Filter leads by text and date range.
- [x] **Statistics:** Real-time stats for Total Leads, New Leads, Pipeline Value, and Won Revenue.
- [x] **Settings:** Webhook URL generation and JSON payload examples.
- [x] **UI Polish:** Loading skeletons, responsive sidebar, minimal header.

## Recent Fixes & Improvements
- **Performance:** Resolved "Maximum update depth exceeded" by optimizing `ScrollArea` usage.
- **Stability:** Fixed "Cannot update a component while rendering" errors in Drag-and-Drop logic.
- **Database:** Ensured all tables (`settings`) are correctly pushed to the database.
- **Logic:** Corrected Pipeline Value calculation to sum "Proposta Enviada" specifically.
- **UX:** Added loading states to prevent duplicate submissions.

## Next Steps
- [ ] **Webhooks:** Implement actual webhook triggering on lead events.
- [ ] **Email Integration:** Send emails directly from the CRM.
- [ ] **Mobile Optimization:** Further refine mobile drag-and-drop experience.
