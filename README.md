# Soccer Diary

A habit-forming training journal for soccer players. Log daily sessions, track mood and skills, earn XP, unlock achievements, and get AI-powered coaching insights — all in a polished dark-mode mobile app.

---

## Screenshots

_Screenshots coming soon. Run the app via Expo Go to see it live._

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo SDK 54) |
| Navigation | React Navigation v7 |
| Backend API | Express.js (Node.js + TypeScript) |
| Database | PostgreSQL (via Drizzle ORM) |
| AI coaching | OpenAI GPT-4o-mini |
| Auth | Apple Sign-In / Google OAuth / Email+Password (JWT) |
| State | React Context + TanStack Query v5 |

---

## Prerequisites

- **Node.js** 20+
- **Expo Go** app on your iPhone or Android device (for testing on device)
- A **PostgreSQL** database (Replit provides one automatically)
- An **OpenAI API key** (for AI coaching insights)

---

## Environment Variables

Create these in your environment (Replit manages them automatically via Secrets):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret used to sign JWTs — use a long random string |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL (default: `https://api.openai.com/v1`) |
| `REPLIT_DEV_DOMAIN` | Set automatically by Replit — used for Expo proxy and CORS |
| `EXPO_PUBLIC_DOMAIN` | Set automatically at dev start — the Express server domain |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | (Optional) Google OAuth Client ID for Google Sign-In |

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up the database tables
npm run db:migrate

# 3. Start the Express backend (port 5000)
npm run server:dev

# 4. In a separate terminal, start the Expo dev server (port 8081)
npm run expo:dev
```

Then scan the QR code from the Expo Go app on your device, or open the web version at `http://localhost:8081`.

---

## Running on Replit

Both servers start automatically via the configured workflows:

- **Start Backend** — runs `npm run server:dev` (Express on port 5000)
- **Start Frontend** — runs `npm run expo:dev` (Expo Metro on port 8081)

Use Replit's **URL bar menu → Scan QR code** to open the app in Expo Go on your device.

---

## Database Migrations

The project uses a manual migration script (`server/db/migrate.ts`) that creates all tables using `CREATE TABLE IF NOT EXISTS` — safe to run repeatedly.

```bash
npm run db:migrate
```

Tables created:
- `users` — player accounts (supports email/password and OAuth providers)
- `diary_entries` — training logs linked to users
- `waitlist` — email capture for Pro tier launch

---

## Folder Structure

```
soccer-diary/
├── client/               # React Native (Expo) app
│   ├── App.tsx           # Root component, font loading, navigation
│   ├── components/       # Reusable UI components
│   ├── constants/        # Theme, colors, XP/level logic, templates
│   ├── contexts/         # AuthContext, DiaryContext, PremiumContext
│   ├── lib/              # TanStack Query client, API helpers
│   ├── navigation/       # Stack + tab navigators
│   ├── screens/          # All app screens
│   └── services/         # Token storage (SecureStore)
│
├── server/               # Express.js API
│   ├── index.ts          # Server entry point, middleware setup
│   ├── routes.ts         # All API routes
│   ├── auth.ts           # JWT sign/verify helpers
│   ├── middleware.ts      # requireAuth middleware
│   └── db/
│       ├── index.ts      # Drizzle database client
│       └── migrate.ts    # Database migration script
│
├── shared/               # Code shared between client and server
│   └── schema.ts         # Drizzle ORM table definitions and types
│
├── assets/               # Images, icons, splash screen
├── scripts/              # Static build scripts (do not modify)
├── app.json              # Expo configuration
└── drizzle.config.ts     # Drizzle ORM configuration
```

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/session` | No | Sign in / sign up (email or OAuth) |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PATCH | `/api/auth/me` | JWT | Update user profile |
| GET | `/api/entries` | JWT | List all diary entries (newest first) |
| POST | `/api/entries` | JWT | Create a new diary entry |
| PUT | `/api/entries/:id` | JWT | Update an existing entry |
| DELETE | `/api/entries/:id` | JWT | Delete an entry |
| POST | `/api/waitlist` | No | Join the Pro waitlist |
| POST | `/api/ai-insights` | JWT | Generate AI coaching insights |

---

## Setting Up Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 Client ID (type: Web application)
3. Add `https://auth.expo.io/@your-username/soccer-diary` as an authorized redirect URI
4. Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in your environment to the Client ID

---

## Setting Up Apple Sign-In

Apple Sign-In works automatically on iOS 13+ via `expo-apple-authentication`. No extra configuration is needed for development with Expo Go. For production builds, ensure your Apple Developer account has the **Sign In with Apple** capability enabled for the `com.soccerdiary.app` bundle.

---

## Premium / Pro Tier

Pro features are **coming soon**. The Upgrade screen collects waitlist emails via `POST /api/waitlist`. All users are currently on the free tier. Real payment integration (App Store / Google Play billing) will be added in a future release.
