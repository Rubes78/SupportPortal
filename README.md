# Support Portal

A self-hosted knowledge base and support documentation platform built with Next.js 14, PostgreSQL, and a rich WYSIWYG editor. Import content from Google Docs or Word documents, organize it into categories, and publish it for your users — with full-text search, threaded comments, version history, and role-based access control.

---

## Features

- **WYSIWYG Editor** — TipTap editor with headings, tables, code blocks, links, and images
- **Version History** — Every save creates a version; compare diffs side by side
- **Full-Text Search** — PostgreSQL `tsvector` with prefix query support
- **Document Import** — Import from `.docx` files, individual Google Docs, or an entire Google Drive folder
- **Hierarchical Categories** — Nested category structure with drag-and-drop ordering
- **Threaded Comments** — Optional moderation workflow; anonymous comments supported
- **Article Feedback** — Helpful / not helpful widget per article
- **Role-Based Access** — `ADMIN`, `EDITOR`, `VIEWER` roles with middleware-enforced routing
- **Admin Panel** — User management, comment moderation, site configuration
- **Google Drive Folder Import** — Point at a folder and bulk-import all Docs; subfolder names auto-match to categories

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (credentials + JWT) |
| Editor | TipTap v2 |
| HTML Sanitization | sanitize-html |
| Docx Import | mammoth.js |
| Google Docs API | googleapis |
| Container | Docker / Docker Compose |

---

## Prerequisites

- **Node.js** 18 or later
- **Docker** and **Docker Compose** (for PostgreSQL)
- **Git**
- A **Google Cloud service account** *(optional — only needed for Google Docs/Drive import)*

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd SupportPortal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# PostgreSQL — matches docker-compose.yml defaults, change for production
DATABASE_URL="postgresql://support_portal:support_portal_dev@localhost:5432/support_portal"

# NextAuth — generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Service Account (optional — see Google Docs Integration below)
GOOGLE_SERVICE_ACCOUNT_KEY=''

# Public config
NEXT_PUBLIC_SITE_NAME="Support Portal"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 4. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 5. Set up the database

```bash
npx prisma generate      # generate the Prisma client
npx prisma migrate deploy  # apply all migrations
npm run db:seed          # create default users and sample data
```

### 6. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Quick Start (all-in-one)

The repository includes helper scripts that handle every step above automatically:

```bash
./start.sh    # starts Postgres, runs migrations, seeds DB, launches Next.js via PM2
./stop.sh     # stops the Next.js process (Postgres keeps running)
```

These scripts require [PM2](https://pm2.keymetrics.io/) to be installed globally:

```bash
npm install -g pm2
```

To auto-start the portal on system boot, run once after the first `./start.sh`:

```bash
pm2 startup    # follow the printed instructions (one sudo command)
pm2 save       # persist the process list
```

After that the portal starts automatically on reboot — no manual intervention needed.

**Useful PM2 commands:**

```bash
pm2 status                  # check running processes
pm2 logs support-portal     # tail logs
pm2 restart support-portal  # restart after code changes
```

---

## Default Credentials

Created by `npm run db:seed`:

| Email | Password | Role |
|---|---|---|
| admin@example.com | admin123! | ADMIN |
| editor@example.com | editor123! | EDITOR |

**Change these immediately in any non-development environment.**

---

## Database Management

```bash
npm run db:generate    # regenerate Prisma client after schema changes
npm run db:migrate     # create and apply a new migration (dev)
npm run db:push        # push schema changes without a migration file (prototyping)
npm run db:seed        # reseed default data (idempotent)
npm run db:studio      # open Prisma Studio at http://localhost:5555
```

---

## Google Docs Integration

The portal can import documents directly from Google Docs and Google Drive. This requires a Google Cloud **service account** with the Google Docs API and Google Drive API enabled.

### Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable the **Google Docs API** and **Google Drive API**
4. Create a **Service Account** under *IAM & Admin → Service Accounts*
5. Generate a JSON key for the service account and download it
6. In the Support Portal: go to **Admin → Configuration → Google Docs Integration**
7. Paste the entire contents of the JSON key file into the textarea and save

### Sharing documents

Before importing, share each document or folder with the service account's email address (found in the JSON key as `client_email`) with at least **Viewer** access.

### Importing a folder

1. Go to **Dashboard → Import → Google Drive Folder**
2. Paste the folder URL (`https://drive.google.com/drive/folders/FOLDER_ID`)
3. Click **Browse Folder** — the portal scans all subfolders recursively
4. Subfolder names are automatically matched to existing categories by name
5. Review the list, adjust categories and draft/publish status per document
6. Click **Import N Documents** — articles are created and version-tracked

---

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public pages — home, articles, search, categories
│   ├── (auth)/            # Login and registration pages
│   ├── (dashboard)/       # Editor dashboard — create, edit, import, version history
│   ├── (admin)/           # Admin panel — users, categories, comments, configuration
│   └── api/               # REST API routes
├── components/
│   ├── articles/          # ArticleCard, ArticleRenderer, VersionDiff
│   ├── comments/          # CommentForm, CommentItem, CommentThread
│   ├── editor/            # TiptapEditor, EditorToolbar
│   ├── import/            # FolderImport
│   ├── search/            # SearchBar, SearchResults
│   └── ui/                # Button, Input, Modal, Pagination
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client singleton
│   ├── sanitize.ts        # HTML sanitization (XSS prevention)
│   ├── search.ts          # Full-text search query builder
│   ├── slugify.ts         # URL slug generation
│   └── google-docs/       # Google API client and Docs → HTML converter
└── types/                 # TypeScript interfaces and NextAuth extensions
prisma/
├── schema.prisma          # Database schema
├── seed.ts                # Seed script
└── migrations/            # SQL migration history
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **VIEWER** | Read published articles, search, post comments |
| **EDITOR** | All VIEWER permissions + create/edit/import articles |
| **ADMIN** | All EDITOR permissions + manage users, categories, tags, comments, site config |

Role assignment is managed in **Admin → Users**. New registrations default to `VIEWER` (configurable in site settings).

---

## Configuration

All runtime configuration is managed through **Admin → Configuration**:

| Setting | Description |
|---|---|
| Site Name / Description | Displayed in the header and meta tags |
| Allow Registration | Toggle public sign-up on or off |
| Default Role | Role assigned to newly registered users |
| Comments | Enable/disable, require approval, allow anonymous |
| Articles Per Page | Pagination size for article lists |
| Show Author | Display author name on articles |
| Google Service Account | JSON key for Google Docs/Drive import |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret for signing JWTs — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical URL of the app (used by NextAuth for redirects) |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public base URL (used in client-side links) |
| `NEXT_PUBLIC_SITE_NAME` | No | Site display name (default: "Support Portal") |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | No | Service account JSON as a string (can also be set via Admin UI) |

---

## Production Deployment

For a production deployment, also:

1. Set `NODE_ENV=production`
2. Run `npm run build` and use `npm start` (or configure PM2 with `npm start` instead of `next dev`)
3. Use a strong, random `NEXTAUTH_SECRET`
4. Change the default seed passwords or disable registration after creating your admin account
5. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your public domain
6. Consider placing the app behind a reverse proxy (nginx, Caddy) with HTTPS

---

## License

MIT
