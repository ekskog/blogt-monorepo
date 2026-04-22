# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Three-tier blog platform using npm workspaces. No monorepo build orchestration (no Turborepo/Nx) — each package is independently deployed.

- **`blogt-api`** — Express.js read API, serves blog posts from file-based markdown storage
- **`blogt-editor`** — Express.js authenticated editing backend with AI vision integrations
- **`blogtv`** — Vue 3 + Vite SPA for reading blog posts, served via Nginx

## Commands

### Root (run from repo root)

```bash
npm run install:all     # Install all workspace dependencies
npm run start:api       # Start blogt-api
npm run start:editor    # Start blogt-editor
npm run start:tv        # Start blogtv (Vite dev server)
```

### blogtv (frontend)

```bash
cd blogtv
npm run dev             # Vite dev server
npm run build           # Production build
npm run preview         # Preview production build
npm run lint            # ESLint --fix
npm run format          # Prettier format src/
npm run tailwind:build  # Rebuild Tailwind CSS (watch mode)
```

### blogt-api / blogt-editor (backends)

```bash
cd blogt-api   # or blogt-editor
npm run dev    # nodemon with DEBUG logging
npm start      # Production start
```

No test suite exists in any package.

## Architecture

### Data Flow

```
blogtv (Vue 3 SPA)
  └─ fetches from https://blog-api.ekskog.net  →  blogt-api
       └─ reads markdown files from posts/{year}/{month}/{day}.md
       └─ images stored in MinIO at https://objects.hbvu.su/blotpix/

blogt-editor (authenticated)
  └─ writes markdown files (same posts/ directory shared with blogt-api)
  └─ handles image uploads → MinIO
  └─ AI integrations: Azure Computer Vision, Google Cloud Vision
```

### Post Storage Format

Posts are markdown files at `blogt-api/posts/{year}/{month}/{day}.md`. Each file has front-matter metadata:
```
Date: YYYY-MM-DD
Tags: tag1, tag2
Title: Post title

Post body in markdown...
```

A `tags.json` index is maintained alongside the posts directory.

### blogtv Frontend Structure

- `src/router/index.js` — routes: `/posts`, `/post/:date`, `/search`, `/explore-day`
- `src/stores/` — Pinia state (posts store is the primary one)
- `src/components/` — `BlogPosts`, `BlogPost`, `BlogSearch`, `ExploreDay`, `BlogNavbar`, `GeminiViewer`, `ExifViewer`
- `src/utils/loadAlbums.js` — utility for fetching image EXIF data
- Tailwind CSS: edit `src/assets/input.css`, output is `src/assets/output.css` (generated)
- Path alias `@/` resolves to `./src`

### blogt-editor Auth

Session-based auth via `utils/authMiddleware.js`. All `/text` routes require authentication. Passwords hashed with bcrypt. Session secret falls back to a hardcoded string if `SESSION_SECRET` env var is not set.

## Environment Variables

**blogtv**: `VITE_GEMINI_API_KEY` (in `.env` or passed as Docker build arg)

**blogt-editor**: `SESSION_SECRET`, `NODE_ENV`, `IN_CONTAINER` (set to `1` in Docker)

**blogt-api / blogt-editor**: `DEBUG` controls log verbosity (e.g., `blogt-api:*`)

## Deployment

CI/CD via GitHub Actions (`.github/workflows/`). On push to `main`:
1. Docker image built and pushed to `ghcr.io/ekskog/`
2. Deployed to Kubernetes namespace `blogt`
3. Kubernetes configs live in `k8s/` within each service directory

The frontend Dockerfile is multi-stage: Node 20-alpine build → nginx:alpine serve. The `nginx.conf` handles SPA routing with `try_files $uri /index.html`.
