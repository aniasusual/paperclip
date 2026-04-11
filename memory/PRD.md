# IdeaLog - Notion-Style Idea Logger

## Problem Statement
Create an idea logger app in Notion style that lets users add, edit, categorize, and archive ideas. Support search and tagging and a clean list view.

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Database**: MongoDB with `ideas` and `categories` collections

## User Personas
- Individual professionals capturing and organizing ideas
- Team members logging product/design/tech ideas
- Anyone wanting a clean, minimal note-taking alternative

## Core Requirements (Static)
- Add, edit, delete ideas with title, content, category, tags, priority
- Archive/unarchive ideas
- Search by title, content, tags
- Filter by category, priority, tags
- Predefined + custom categories
- Clean Notion-style list view

## What's Been Implemented (April 11, 2026)
- Full CRUD backend API for ideas and categories
- Tag aggregation endpoint
- Stats endpoint
- Search with regex matching
- Category/priority/tag/archive filtering
- Clean Notion-style UI with sidebar navigation
- IdeaDialog for create/edit with tag input
- Animated list with Framer Motion
- Responsive design
- Custom category creation/deletion
- Sonner toast notifications

## Prioritized Backlog
### P0 (Done)
- [x] Ideas CRUD
- [x] Categories CRUD with defaults
- [x] Search & filtering
- [x] Archive functionality
- [x] Tags support
- [x] Priority levels

### P1 (Next)
- [ ] Rich text / markdown rendering for idea content
- [ ] Drag-and-drop idea reordering
- [ ] Keyboard shortcuts (Cmd+N for new idea)

### P2 (Later)
- [ ] Export ideas as markdown/PDF
- [ ] Bulk actions (archive/delete multiple)
- [ ] Dark mode toggle
- [ ] Idea templates
