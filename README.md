# Drone Monitoring API and Frontend

Project for Assignments #1 and #2. It provides the Drone Config Server API, the Drone Log Server API, and three frontend pages.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and fill in the Drone ID, Config Server URL, Log Server URL, and Log Server bearer token. Keep `.env` private; it is ignored by Git.
3. Run `npm install` and then `npm run dev` (or `npm start`).
4. Open `http://localhost:8000/`.

## Environment variables

- `DRONE_ID`: positive integer for the drone shown by the frontend.
- `CONFIG_API`: Google Apps Script endpoint for the Drone Config Server.
- `LOG_API`: PocketBase collection records endpoint for the Drone Log Server.
- `LOG_API_TOKEN`: bearer token for reading and creating log records.
- `PORT`: local port (optional; defaults to 8000).

Set the same variables in Vercel under Project Settings → Environment Variables. Never commit real API tokens or a populated `.env` file.

## Vercel deployment

Deploy this folder (`Back_end`) as the project root. Vercel detects the Express app in `server.js`; frontend files are in `public/` so Vercel can serve them as static assets. Set the environment variables above for Production and redeploy after changing them.

## Pages

- `/` — dashboard with Config, Temperature Log, and View Logs tabs.
- `/config.html` — configuration page.
- `/form.html` — temperature entry page.
- `/logs.html` — log table page.

## API routes

- `GET /configs/:droneId` — returns only `drone_id`, `drone_name`, `light`, `country`, and `weight`.
- `GET /status/:droneId` — returns only `condition`.
- `GET /logs/:droneId?page=1` — returns up to 12 records, newest first, with only `drone_id`, `drone_name`, `created`, `country`, and `celsius`. Page is optional; pagination uses 12 records per page.
- `POST /logs` — creates a log with only `drone_id`, `drone_name`, `country`, and `celsius` from the JSON body.

Example POST body:

```json
{
  "drone_id": 3001,
  "drone_name": "Dot Dot",
  "country": "India",
  "celsius": 45
}
```

## Source repository and submission

Push the project source (excluding `.env` and `node_modules`) to a GitHub repository. Submit that repository URL and the deployed Vercel URL. For the four direct page links, use the deployed root URL and append `/config.html`, `/form.html`, and `/logs.html` for the other three pages.

