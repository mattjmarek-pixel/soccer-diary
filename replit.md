# Soccer Diary — Replit Agent Guide

## Overview

Soccer Diary is a habit-forming training journal mobile app for soccer players. Players log daily training sessions with mood ratings, skill categories, duration, video attachments, and reflections. The app provides a timeline feed, statistics/charts, achievement badges, AI-powered coaching insights, and a freemium upgrade path (free vs Pro tier).

The project uses a **React Native (Expo)** frontend with an **Express.js** backend. Data is stored locally on-device via AsyncStorage (for diary entries, auth, and premium status) while the server provides AI insights via OpenAI and has a PostgreSQL schema defined with Drizzle ORM. The app is configured to run on Replit with proxy support for Expo dev server and Express API server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK 54 with React Native 0.81, new architecture enabled
- **Entry point**: `client/index.js` → `client/App.tsx`
- **Path aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`
- **Navigation**: React Navigation v7 with a root native stack navigator wrapping a bottom tab navigator
  - **Root Stack**: Onboarding → Auth → Main (tabs), plus modal screens (NewEntry, DiaryDetail, EditProfile, Insights, Templates, Upgrade, PlayerCardModal)
  - **NewEntry modal**: 5-step wizard for new entries (Mood → Duration → Skills → Notes → Media) with animated progress bar and confetti celebration overlay on save; falls back to single-form layout for editing. `headerShown` is false for wizard (custom header) and true for edit mode.
  - **Bottom Tabs**: Timeline, Stats, Achievements (Badges), Profile — with a floating action button in the center for creating new entries
- **State Management**: React Context API (AuthContext, DiaryContext, PremiumContext) — no Redux or Zustand
- **Data Persistence**: AsyncStorage for all client-side data (user auth, diary entries, premium status, onboarding state). There is no server-side diary storage — all entries live on-device.
- **Styling**: Custom theme system in `client/constants/theme.ts` with dark-mode-only design (green #00E676 primary, dark charcoal backgrounds). Montserrat font family loaded via expo-font.
- **Animations**: React Native Reanimated for press animations, list entry animations, spring effects, confetti particles
- **Key Libraries**: expo-haptics (tactile feedback), expo-image-picker, expo-video, expo-sharing, react-native-view-shot, react-native-svg (charts), expo-blur, react-native-keyboard-controller

### Backend (Express.js)

- **Entry point**: `server/index.ts`
- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production build)
- **API Routes** (`server/routes.ts`):
  - `POST /api/ai-insights` — Sends diary entries to OpenAI for personalized coaching analysis (returns insights, weekly tip, mood analysis, skill recommendation)
- **Storage** (`server/storage.ts`): In-memory `MemStorage` class for users — currently not connected to the diary flow. The actual diary data lives entirely in AsyncStorage on the client.
- **CORS**: Configured to allow Replit dev/deployment domains and localhost origins for Expo web dev
- **Static serving**: Production mode serves a landing page from `server/templates/landing-page.html`; Expo web build output can be served statically

### Database Schema (Drizzle ORM + PostgreSQL)

- **Config**: `drizzle.config.ts` pointing to `shared/schema.ts`, PostgreSQL dialect, uses `DATABASE_URL` env var
- **Tables defined**:
  - `users` — id (UUID), username, password
  - `conversations` — id (serial), title, created_at (from `shared/models/chat.ts`)
  - `messages` — id (serial), conversation_id (FK), role, content, created_at (from `shared/models/chat.ts`)
- **Important**: The conversations/messages tables are part of Replit AI integrations (chat/audio features) and are not core to the diary functionality. The core diary entries are NOT in the database — they're in AsyncStorage. If migrating to server-side storage, new tables for diary entries would need to be created.
- **Push command**: `npm run db:push` (drizzle-kit push)

### Authentication

- **Current implementation**: Simulated auth via AsyncStorage. No real backend auth — `AuthContext` stores user credentials locally, generates UUIDs client-side, and validates against locally stored user records.
- **Design spec calls for**: Apple Sign-In (iOS) + Google Sign-In (Android), but these are not yet implemented
- **Flow**: Onboarding (3 screens) → Auth (email/password sign up or sign in) → Main app. Auth state persisted in AsyncStorage.

### Premium / Freemium System

- **Managed via**: `PremiumContext` with AsyncStorage persistence
- **Tiers**: Free and Pro
- **Premium features**: AI insights, advanced charts, unlimited entries, video attachments, social sharing, premium training templates
- **No real payment integration** — upgrade currently just toggles a flag in AsyncStorage

### Replit AI Integrations

Located in `server/replit_integrations/` and `client/replit_integrations/`:
- **Chat**: Conversation CRUD with OpenAI streaming (uses PostgreSQL via Drizzle)
- **Audio**: Voice recording, playback via AudioWorklet, speech-to-text, text-to-speech
- **Image**: Image generation via gpt-image-1
- **Batch**: Rate-limited batch processing utility with retries
- These are pre-built integration modules, mostly scaffolded and may not all be actively used by the core app

### Build & Dev Scripts

- `npm run expo:dev` — Start Expo dev server with Replit proxy config
- `npm run server:dev` — Start Express server with tsx
- `npm run server:build` — Bundle server with esbuild
- `npm run server:prod` — Run production server
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` — Build Expo web output for static serving

## External Dependencies

### Third-Party Services
- **OpenAI API** (via Replit AI Integrations): Used for AI coaching insights (`/api/ai-insights`), chat, audio, and image generation. Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables.
- **PostgreSQL**: Required for Drizzle ORM schema (users, conversations, messages tables). Connection via `DATABASE_URL` environment variable.

### Key Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL
- `REPLIT_DEV_DOMAIN` — Used for Expo proxy and CORS
- `EXPO_PUBLIC_DOMAIN` — Client-side API URL configuration

### Notable NPM Packages
- **expo** (SDK 54) — Mobile app framework
- **express** — Backend API server
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **openai** — OpenAI SDK
- **@tanstack/react-query** — Server state management (set up but lightly used)
- **react-native-reanimated** — Animations
- **react-native-svg** — Charts on Stats screen
- **react-native-view-shot** — Screenshot capture for sharing diary entries
- **expo-video** — Video playback in diary entries
- **expo-image-picker** — Photo/video selection for entries and profile
- **p-limit** / **p-retry** — Batch processing utilities