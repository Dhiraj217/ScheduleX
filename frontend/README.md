# ScheduleX — Frontend Application

AI-powered timetable, exam, and academic resource optimization platform by **DMR DEVELOPERS (Dhiraj Rajai)**.

## Tech Stack

- **Frontend:** Vite, React 18, TypeScript, shadcn/ui, Tailwind CSS, TanStack Query, Zustand, Recharts
- **Backend API:** FastAPI + Google OR-Tools CP-SAT + PostgreSQL + Redis/RQ *(private core repository; API contract documented in [`../docs/openapi.json`](../docs/openapi.json))*

## Getting Started

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:8080` by default.

## Verification

```sh
npx tsc -p tsconfig.app.json --noEmit
npm run build
npm test -- --run
```

## License

Copyright (c) 2026 Dhiraj Rajai (DMR DEVELOPERS). All Rights Reserved. See [`../LICENSE`](../LICENSE).
