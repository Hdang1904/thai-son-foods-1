import pg from 'pg';
import { execSync } from 'child_process';

const DB_URL = 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/postgres?sslmode=disable';
const pool = new pg.Pool({ connectionString: DB_URL });

async function setupStaging() {
  const client = await pool.connect();
  try {
    console.log('Terminating existing connections to WebTSF_staging...');
    await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'WebTSF_staging' AND pid <> pg_backend_pid();
    `);
    
    await client.query('DROP DATABASE IF EXISTS "WebTSF_staging";');
    console.log('Dropped WebTSF_staging.');

    // Try template clone by first terminating other connections to WebTSF if idle or just create empty and restore
    console.log('Creating fresh WebTSF_staging database...');
    await client.query('CREATE DATABASE "WebTSF_staging";');
    console.log('WebTSF_staging created.');

    console.log('Restoring data from pre_qa_audit_backup.sql to WebTSF_staging...');
    execSync('psql -U postgres -h 127.0.0.1 -p 5432 -d WebTSF_staging -f scripts/backups/pre_qa_audit_backup.sql', {
      env: { ...process.env, PGPASSWORD: 'Tsf@123' },
      stdio: 'inherit'
    });
    console.log('Restore to WebTSF_staging completed successfully!');
  } catch (err) {
    console.error('Error setting up staging DB:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupStaging();
