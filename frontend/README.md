# Frontend (Vite + React + TypeScript)

## Prerequisites

- Node.js 18+ and npm

## Install

PowerShell (Windows):

```powershell
powershell -NoProfile -Command "Set-Location 'C:\Users\Admin\Desktop\summarize application\frontend'; npm ci --no-fund --no-audit --progress=false"
```

## Run (dev)

PowerShell (Windows):

```powershell
powershell -NoProfile -Command "Set-Location 'C:\Users\Admin\Desktop\summarize application\frontend'; npm run dev"
```

Vite will start at `http://localhost:5173`.

## Build

```powershell
powershell -NoProfile -Command "Set-Location 'C:\Users\Admin\Desktop\summarize application\frontend'; npm run build"
```

## Lint

```powershell
powershell -NoProfile -Command "Set-Location 'C:\Users\Admin\Desktop\summarize application\frontend'; npm run lint"
```

## Routes

- `/login` – login screen (role + name)
- `/student` – student dashboard with weekly report table
- `/coordinator` – coordinator dashboard with Program Outcome bar chart
- `/chairman` – chairman dashboard (aggregated view using the same chart)

Authentication is handled via a simple `zustand` store in `src/store/auth.ts` and a route guard component `src/components/RequireAuth.tsx` used in `src/routes.tsx`.
