#!/usr/bin/env node
'use strict';

const Database = require('better-sqlite3');
const { readFileSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');

const dbPath = process.env.DATABASE_PATH ?? './data/clinic.db';

if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Bootstrap schema so this script is safe on a fresh DB
const schema = readFileSync(join(__dirname, '..', 'src', 'infra', 'persistence', 'sqlite', 'schema.sql'), 'utf-8');
db.exec(schema);

const seed = readFileSync(join(__dirname, '..', 'seed', 'test-data.sql'), 'utf-8');
db.exec(seed);
db.close();

console.log(`Seeded ${dbPath}`);
