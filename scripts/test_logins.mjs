import { Pool } from 'pg';

const users = ['postgres', 'ITPM2', 'itpm2', 'webtsf', 'WebTSF', 'admin'];
const passwords = [
  'Tsf@123312',
  'tsf@123312',
  'TSF@123312',
  'Tsf@123123',
  'Tsf@123',
  'Tsf@123456',
  '123312',
];

async function tryConnect(user, pw) {
  const p = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: user,
    password: pw,
    database: 'postgres',
    connectionTimeoutMillis: 1500,
  });

  try {
    const res = await p.query('SELECT current_user, current_database();');
    console.log(`>>> SUCCESS! User: "${user}", Password: "${pw}"`);
    console.log(res.rows[0]);
    await p.end();
    return true;
  } catch (err) {
    await p.end().catch(() => {});
    return false;
  }
}

async function run() {
  console.log('Testing combinations...');
  for (const u of users) {
    for (const pw of passwords) {
      const ok = await tryConnect(u, pw);
      if (ok) return;
    }
  }
  console.log('All combinations failed.');
}

run();
