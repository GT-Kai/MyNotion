# My Notion Clone (Local-First)

A local-first "Notion-like" workspace built with React, Node.js, and SQLite.
Currently in **Alpha / MVP** stage.

## Architecture

*   **Architecture**: Local-First (Offline capable logic, currently serving from local Node process)
*   **Frontend**: React, TypeScript, Vite, TailwindCSS, React Query
*   **Backend**: Node.js, Fastify, better-sqlite3
*   **Database**: Local SQLite file (`apps/server/data/workspace.db`)
*   **Monorepo**: Managed via npm/pnpm workspaces

## Current Status (Completed)

### Core Infrastructure
- [x] Monorepo setup (Web + Server + Shared Types)
- [x] SQLite Database Schema (Pages, Blocks)
- [x] Backend API (REST) for Page CRUD and Block bulk updates

### Page Management
- [x] Create new Page
- [x] List all Pages
- [x] Basic Navigation (Page List <-> Page Detail)

### Block Editor (V0.1)
- [x] Data Structure: Linear list of blocks (No nesting yet)
- [x] Block Types: Paragraph, Heading 1/2/3, Todo, Code, Divider
- [x] Basic Interactions:
    - [x] `Enter` to create new block
    - [x] `Backspace` to delete empty block
    - [x] Select menu to change block type
    - [x] Checkbox toggling for Todos
- [x] Auto-save (Debounced, full-page save)

---

## Roadmap (The Gap to Notion)

### Phase 1: Core Editor Experience (Current Focus)
- [x] **Nested Blocks**: Support parent-child relationships (indentation)
- [x] **Keyboard Polish**: Arrow keys navigation, Enter/Backspace behaviors
- [x] **Rich Text**: Inline styles (Bold, Italic, Link) via Markdown
- [ ] **Slash Commands**: Type `/` to open a menu for creating blocks
- [ ] **Drag & Drop**: Reorder blocks via dragging
- [ ] **Selection**: Multi-block selection and operations

### Phase 2: UI & Polish
- [ ] **Sidebar**: Collapsible sidebar with page tree
- [ ] **Page Properties**: Icon, Cover Image, Created/Updated dates
- [ ] **Better Styling**: Polish the "raw" look to match Notion's aesthetics
- [ ] **Dark Mode**

### Phase 3: Advanced Types
- [ ] **Database/Collections**: Table view, Board view
- [ ] **Media**: Image upload and hosting (local file storage)
- [ ] **Page Linking**: `[[` to link to other pages

### Phase 4: Cloud & Sync
- [ ] **Auth**: User login
- [ ] **Sync Engine**: Push local SQLite changes to cloud (CRDTs or naive last-write-wins)

---

## 🛠 How to Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development (Web + Server)**
    ```bash
    npm run dev
    ```
    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:3000`
