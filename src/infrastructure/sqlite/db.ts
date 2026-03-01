import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type SqliteDatabase = Database.Database;

export interface OpenSqliteDatabaseOptions {
  filePath?: string;
  enableWal?: boolean;
}

export function openSqliteDatabase(options: OpenSqliteDatabaseOptions = {}): SqliteDatabase {
  const filePath = options.filePath ?? path.resolve(process.cwd(), "local", "dealflow-lite.db");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const db = new Database(filePath);
  db.pragma("foreign_keys = ON");
  if (options.enableWal ?? true) {
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function applySqliteSchema(db: SqliteDatabase, schemaFilePath?: string): void {
  const schemaPath = schemaFilePath ?? path.resolve(process.cwd(), "sqlite", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  db.exec(sql);
}

