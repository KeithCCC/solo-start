import path from "node:path";
import type { Repositories } from "@/src/domain";
import { applySqliteSchema, createSqliteRepositories, openSqliteDatabase } from "@/src/infrastructure/sqlite";

const LOCAL_OWNER_ID = process.env.LOCAL_OWNER_ID ?? "local-user";

let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (cached) return cached;
  const dbPath = process.env.LOCAL_DB_PATH ?? path.resolve(process.cwd(), "local", "dealflow-lite.db");
  const db = openSqliteDatabase({ filePath: dbPath });
  applySqliteSchema(db);

  cached = createSqliteRepositories(db);
  void cached.profiles.upsertLocalProfile({
    id: LOCAL_OWNER_ID,
    displayName: "Local Demo User",
    locale: "ja-JP",
    timezone: "Asia/Tokyo",
  });
  return cached;
}

export function getLocalOwnerId(): string {
  return LOCAL_OWNER_ID;
}

