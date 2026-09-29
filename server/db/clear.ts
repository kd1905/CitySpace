import { initDatabase, execute, queryAll } from './database';

async function clearDatabase() {
  await initDatabase();
  console.log('[Clear] Deleting all dummy and seeded data from database...');
  await execute('DELETE FROM property_locations');
  await execute('DELETE FROM enquiries');
  await execute('DELETE FROM properties');
  await execute('DELETE FROM agents');
  const count = await queryAll('SELECT count(*) as count FROM properties');
  console.log('[Clear] Properties in database now:', count);
}

clearDatabase()
  .then(() => {
    console.log('[Clear] Database successfully cleared.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Clear] Error clearing database:', err);
    process.exit(1);
  });
