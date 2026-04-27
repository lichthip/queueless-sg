# QueueLess SG

> Real-time queue visibility and load prediction for Singapore public service centres.

Built to demonstrate the kind of citizen-facing tooling that replaces physical
queue management with live data and smart redirection — the same philosophy behind
products like Parking.sg and FormSG.


## Live Demo

Citizen view: https://queueless-sg.vercel.app  
Staff dashboard: https://queueless-sg.vercel.app/dashboard  
Demo login: `admin` / `admin123`

> The server runs on Render's free tier and may take 30–60 seconds to wake up 
> on first visit after a period of inactivity.

## Problem

Polyclinics, ICA, HDB, CPF, and CDC service centres still expose citizens to
opaque wait times and uneven crowd distribution. Even where queuing systems exist,
walk-in congestion isn't surfaced in real time, and there's no cross-centre load
balancing for citizens choosing between nearby locations.

## Solution

A full-stack platform with three layers:

1. **Citizen view** — live map and list of nearby centres ranked by wait time,
   with a per-centre prediction panel showing the best windows to visit today.
2. **Staff dashboard** — authenticated portal for centre staff to manually
   override queue counts, open/close a centre, and monitor aggregate load in
   real time.
3. **Open API** — RESTful endpoints (+ WebSocket events) that third-party
   developers can consume, following the pattern of Data.gov.sg.

## Architecture

```
┌─────────────────┐       WebSocket / REST        ┌──────────────────────┐
│   Next.js 14    │  ◄────────────────────────►  │  Express + Socket.IO │
│  (TypeScript)   │                               │    (TypeScript)      │
│                 │                               │                      │
│  /              │                               │  /api/centers        │
│  /dashboard     │                               │  /api/queues         │
└─────────────────┘                               │  /api/auth           │
                                                  │                      │
                                                  │  SimulationService   │
                                                  │  PredictionService   │
                                                  │                      │
                                                  │  SQLite (WAL mode)   │
                                                  └──────────────────────┘
```


The simulation service ticks every 15 seconds, modelling time-of-day inflow
curves (morning rush 8–10 AM, afternoon dip 12–2 PM, etc.) to generate
realistic queue fluctuations without requiring a live government data feed.

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS  |
| Realtime   | Socket.IO (WebSocket + polling)       |
| Backend    | Node.js, Express, TypeScript          |
| Database   | SQLite via better-sqlite3 (WAL mode)  |
| Maps       | Leaflet + OpenStreetMap (free)        |
| Auth       | JWT (bcrypt-hashed passwords)         |

## Quick Start

```bash
# Server
cd server
npm install
npm run seed   # creates ./data/queueless.db and seeds centres + staff
npm run dev    # http://localhost:4000

# Client (new terminal)
cd client
npm install
npm run dev    # http://localhost:3000
```

## Demo Accounts

| Username         | Password   | Access                  |
|------------------|------------|-------------------------|
| admin            | admin123   | All centres (admin)     |
| jurong_staff     | admin123   | Jurong Polyclinic only  |
| woodlands_staff  | admin123   | Woodlands Polyclinic    |

## API Reference

| Method | Endpoint                        | Auth     | Description                     |
|--------|---------------------------------|----------|---------------------------------|
| GET    | /api/centers                   | —        | All centres with live queue     |
| GET    | /api/centers/:id               | —        | Single centre                   |
| GET    | /api/centers/:id/predict       | —        | Today's best visit windows      |
| GET    | /api/queues/:id/history        | —        | Historical counts (up to 7 days)|
| PATCH  | /api/queues/:id/adjust         | Bearer   | Manual count delta              |
| PATCH  | /api/queues/:id/status         | Bearer   | Open / close a centre           |
| POST   | /api/auth/login                | —        | Returns JWT                     |

WebSocket events (Socket.IO):
- `queue:init`   → full centre list on connect
- `queue:update` → single centre delta on any change

## Trade-offs & Future Work

- **Simulation vs live data**: queue counts are simulated using a time-of-day
  Poisson approximation. The architecture is designed to swap this out for a
  real government data feed (e.g. HealthHub queue API) with no changes to the
  frontend or socket layer.
- **SQLite**: appropriate for a prototype; a horizontal deployment would swap
  to PostgreSQL (the schema is standard SQL).
- **Prediction model**: currently a heuristic load profile. With 2–4 weeks of
  real history in `queue_history`, a simple linear regression or ARIMA model
  would meaningfully improve accuracy.
