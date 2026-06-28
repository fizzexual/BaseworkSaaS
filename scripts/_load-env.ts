import { config } from "dotenv";

// Standalone scripts (run via tsx) don't auto-load .env files the way Next does.
// Import this first so process.env is populated before `@/lib/env` reads it.
// `.env.local` is loaded first; anything already in process.env always wins.
config({ path: ".env.local" });
config();
