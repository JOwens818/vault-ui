# Vault UI

Vault UI is a React application for managing sensitive secrets stored in the Vault API. Users can authenticate, search and filter existing secrets, reveal values on demand, create or edit entries, and perform bulk actions such as import and export.

## Tech Stack

- React 19 with TypeScript and Vite
- Chakra UI component system
- REST integration via `fetch` with runtime configuration
- Nginx-based production container image

## Prerequisites

- Node.js 20+ and npm 10+ for local development
- Access to a running Vault API that exposes the `/api/*` endpoints expected by this UI

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide the API base URL. Create `.env.local` (ignored by git) and set:
   ```
   VITE_API_BASE=https://vault-api.example.com
   ```
   You can also export `VITE_API_BASE` directly in your shell before running the dev server.
3. Start Vite:
   ```bash
   npm run dev
   ```
   The app is available at `http://localhost:5173`. Updates trigger hot reloads.

Common additional scripts:

- `npm run build` — type-check and generate a production build in `dist/`.
- `npm run preview` — serve the production build locally at `http://localhost:4173`.

## Runtime Configuration

The UI resolves its backend URL at runtime. During development it reads `import.meta.env.VITE_API_BASE`. In packaged builds it loads `/env.js`, which is generated when the container starts and can be overridden with the `API_BASE` environment variable. If neither value is provided the application will fail with "Missing API base URL".

## Docker

1. Build the image (runs a production build and bundles it behind Nginx):
   ```bash
   docker build -t vault-ui .
   ```
2. Run the container, mapping port 3000 and pointing it at your API:
   ```bash
   docker run --rm -p 3000:3000 \
     -e API_BASE=https://vault-api.example.com \
     vault-ui
   ```
   The entrypoint renders `/usr/share/nginx/html/env.js` from `env.template.js`, substituting `${API_BASE}` so the frontend can reach your backend.

To verify the container, open `http://localhost:3000` in a browser and inspect the logs; you should see a startup message confirming the injected `API_BASE` value.
