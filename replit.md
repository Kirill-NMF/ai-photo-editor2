# Photo Editing App - AI-Powered Image Transformation

## Overview

This AI-powered web application transforms images using natural language prompts, inspired by Figma's canvas-first approach and Linear's polish. It allows users to upload images, describe desired edits (e.g., "make the sky more dramatic"), and apply AI-powered transformations in real-time. Key features include edit history, before/after comparisons, and a personal gallery for saving edited images. The project aims to provide an intuitive and powerful image editing experience with AI at its core, leveraging Google's Gemini 2.5 Flash Image API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React 18 with TypeScript via Vite. Wouter for client-side routing.
**UI Component System:** Shadcn UI (Radix UI primitives) and Tailwind CSS for styling. Follows a "canvas-first" design principle with a custom spacing scale and Inter/JetBrains Mono typography.
**State Management:** TanStack React Query for server state, React Context API for global UI state, and React hooks for component state.
**Key User Flows:** Onboarding (user preferences), Editor Workspace (upload, prompt-based editing, history, save), and Gallery (browse, detail view, before/after).
**File Upload:** Uppy Dashboard for uploads directly to Replit Object Storage via presigned URLs. Supports JPEG, PNG, WebP up to 20MB, with client-side dimension extraction.

### Backend Architecture

**Runtime & Framework:** Node.js with Express.js, using TypeScript.
**Database Layer:** PostgreSQL via Neon serverless database, with Drizzle ORM for type-safe queries and migrations. Schema defined in `shared/schema.ts` includes `sessions`, `users`, `projects` (groups images/edits), `images` (for original uploads and saved edits with projectId FK), and `edits` (for AI transformations).
**Authentication:** Designed for Replit Auth integration with session-based authentication.
**API Structure:** REST endpoints (`/api/*`) for project management, creating AI edits, saving edits, updating image metadata, and retrieving gallery projects. Includes request/response logging and error handling. Key endpoints: GET/DELETE /api/projects/:id, DELETE /api/edits/:id.
**Storage Strategy:** Interface-based design (`IStorage`) with database-backed storage. Uses optimized JOINs to prevent N+1 queries when fetching projects with images/edits. Replit Object Storage is used for secure image file storage with ACL policies.
**Image Processing & Storage:** Presigned URL generation for uploads. Each upload creates a new project. AI transformations handled by `POST /api/edits`, which downloads source images, converts to base64, calls the Gemini API, uploads the result, and saves the edit record. "Overwrite Last Save" deletes previous save from DB (not just updates) to maintain clean gallery state.

**Thumbnail System:** Automatic WebP thumbnail generation (400x225px, quality 80) using Sharp v0.34.5 provides 96-99.8% compression (e.g., 6.77MB → 13.5KB). Thumbnails stored in `/.private/uploads/{uploadId}/thumb.webp` alongside originals with ACL policy `visibility: "public"`. Public endpoint `/objects/uploads/:uploadId/thumb.webp` serves thumbnails without authentication (checks ACL), while originals remain protected. Generated in background via `generateThumbnailInBackground()` on upload, with admin endpoint `POST /api/admin/generate-thumbnails` for batch regeneration. Database tracks thumbnail URLs for fast gallery loading.

### External Dependencies

**AI Integration (Multi-Provider):** 
- **Hugging Face** (Free): Image-to-image editing via Hugging Face Inference API using `nvidia/ChronoEdit-14B-Diffusers` model through the `fal-ai` provider. Requires `HUGGINGFACE_API_KEY`. Implemented in `server/huggingface.ts`.
- **Google Gemini** (Paid): Uses `gemini-1.5-flash` model via `@google/genai` SDK for image generation. Requires `GEMINI_API_KEY`. Implemented in `server/gemini.ts`.

The `/api/edits` endpoint accepts a `provider` field ("huggingface" | "gemini") to select which AI service to use. Frontend includes dropdown selector in EditorPage for choosing provider. Defaults to Hugging Face (free).

**Database Service:** Neon PostgreSQL (serverless) using `DATABASE_URL` environment variable.
**Development Tools:** Replit-specific plugins, ESBuild, Drizzle Kit for migrations.
**Rate Limiting & Validation:** Express-rate-limit for API throttling and Zod for request validation.
**UI Component Libraries:** Radix UI primitives, Lucide React for iconography, react-dropzone for file uploads.
**Utilities:** clsx + tailwind-merge for CSS, date-fns for date formatting, nanoid for ID generation.