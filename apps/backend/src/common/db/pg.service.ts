import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 300000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 100000),
})

pool.on('error', (err) => {
  // This is a last-resort handler for unexpected errors on idle clients
  console.error('Unexpected error on idle Postgres client', err)
})

export default pool

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect()
  return client
}
