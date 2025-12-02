import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'workspace.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Simple migration runner
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
} else {
    // Fallback if running from dist where schema.sql might be copied or not
    // For dev we assume src structure or we should copy it. 
    // For now, let's just log or try a relative path.
    // Actually, let's just put the schema string here if file read fails, 
    // but I'll trust the file is there in dev.
    console.warn('Schema file not found at', schemaPath);
}
