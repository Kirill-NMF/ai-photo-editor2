import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// HTTP-based driver for all app queries — reliable in serverless/autoscale environments
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });

// Pool kept for connect-pg-simple session store (needs standard pg-compatible interface)
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
