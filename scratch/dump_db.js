const mysql = require('mysql2/promise');
const fs = require('fs');

async function dumpDB() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  console.log('Connected to local MySQL database: bakasur_food_tour_1');

  const tablesToDump = [
    'locations',
    'categories',
    'restaurants',
    'dishes',
    'bakasur_videos',
    'campaign_sessions',
    'campaign_visits',
    'participants',
    'dish_video_mappings',
    'menus',
    'tour_submissions',
    'user_journey_steps'
  ];

  let sqlOutput = `-- ==========================================================
-- Bakasur Ka Food Tour - Complete Production MySQL Database Dump
-- Contains Table Schemas AND Initial Production / Seed Data
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

`;

  for (const table of tablesToDump) {
    try {
      const [[createResult]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      if (createResult) {
        const createTableSql = createResult['Create Table'];
        sqlOutput += `-- --------------------------------------------------------\n`;
        sqlOutput += `-- Table structure for table \`${table}\`\n`;
        sqlOutput += `-- --------------------------------------------------------\n`;
        sqlOutput += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        sqlOutput += `${createTableSql};\n\n`;

        // Only dump rows for seed tables
        const seedTables = ['locations', 'categories', 'restaurants', 'dishes', 'bakasur_videos', 'campaign_visits'];
        if (seedTables.includes(table)) {
          const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
          if (rows.length > 0) {
            sqlOutput += `-- Dumping data for table \`${table}\` (${rows.length} rows)\n`;
            sqlOutput += `INSERT INTO \`${table}\` VALUES\n`;
            
            const rowStrings = rows.map(row => {
              const values = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'number') return val;
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                // Escape string
                const str = String(val)
                  .replace(/\\/g, '\\\\')
                  .replace(/'/g, "\\'")
                  .replace(/\r/g, '\\r')
                  .replace(/\n/g, '\\n');
                return `'${str}'`;
              });
              return `(${values.join(', ')})`;
            });

            sqlOutput += rowStrings.join(',\n') + ';\n\n';
          }
        }
      }
    } catch (e) {
      console.warn(`Warning dumping table ${table}:`, e.message);
    }
  }

  sqlOutput += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  fs.writeFileSync('schema_with_data.sql', sqlOutput, 'utf8');
  console.log('Saved complete database dump to schema_with_data.sql');

  // Also update schema.sql
  fs.writeFileSync('schema.sql', sqlOutput, 'utf8');
  console.log('Updated schema.sql with complete production data');

  await conn.end();
}

dumpDB().catch(console.error);
