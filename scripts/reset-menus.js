const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'local-node.db');
const schemaPath = path.join(rootDir, 'schema.sql');

console.log('--- Resetting Menus Table ---');

// 1. Reset local-node.db (better-sqlite3)
if (fs.existsSync(dbPath)) {
  console.log(`Resetting database: ${dbPath}`);
  try {
    const db = new Database(dbPath);
    
    // Drop existing table
    db.exec('DROP TABLE IF EXISTS menus;');
    console.log('Dropped menus table in local-node.db.');

    // Read and run schema.sql
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract the menus table creation and default inserts
    // (Or we can just execute the whole schema.sql since it uses CREATE TABLE IF NOT EXISTS for others)
    db.exec(schemaSql);
    console.log('Re-initialized menus table and seed data in local-node.db.');
    
    db.close();
  } catch (err) {
    console.error('Error resetting local-node.db:', err);
  }
} else {
  console.log(`local-node.db not found at ${dbPath}, skipping.`);
}

// 2. Reset local Wrangler D1 database
try {
  console.log('Resetting local Wrangler D1 database (info_db)...');
  
  // Drop table
  console.log('Running DROP TABLE command on D1...');
  execSync('npx wrangler d1 execute info_db --local --command="DROP TABLE IF EXISTS menus;"', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  // Re-run schema.sql
  console.log('Executing schema.sql on D1...');
  execSync('npx wrangler d1 execute info_db --local --file=./schema.sql', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  console.log('Re-initialized menus table and seed data in local Wrangler D1 database.');
} catch (err) {
  console.error('Error resetting local Wrangler D1 database:', err.message);
}

console.log('--- Reset Complete ---');
