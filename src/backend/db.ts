import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  site: string;
  capacityKw: number;
  role: "admin" | "client";
  createdAt: string;
  updatedAt: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
};

export type AuditLogRecord = {
  id: string;
  userId: string | null;
  email: string;
  action: string;
  success: number;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

// Database setup
const DB_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_FILE = path.join(DB_DIR, "solarsense.db");

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_FILE);
    _db.exec("PRAGMA journal_mode = WAL;");
    _db.exec("PRAGMA foreign_keys = ON;");
    initSchema(_db);
  }
  return _db;
}

// Password hashing with scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Secret key for HMAC token signing
const JWT_SECRET =
  process.env.AUTH_SECRET || "solarsense-auth-secret-key-super-secure-production-ready-2026";

export function signToken(payload: { userId: string; email: string; exp: number }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function initSchema(db: DatabaseSync) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      site TEXT NOT NULL,
      capacity_kw REAL NOT NULL DEFAULT 4.0,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      action TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      details TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default users if empty
  const countRow = db.prepare("SELECT COUNT(*) as count FROM users;").get() as { count: number };
  if (countRow.count === 0) {
    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, site, capacity_kw, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    insert.run(
      "usr_demo",
      "demo@solarsense.io",
      hashPassword("demo1234"),
      "Demo Evaluator",
      "Campus Rooftop Array — Block C",
      4.0,
      "client",
      now,
      now,
    );

    insert.run(
      "usr_greenfield",
      "client@greenfield.in",
      hashPassword("green1234"),
      "Greenfield Industries",
      "Greenfield Plant — Shed 2",
      4.0,
      "client",
      now,
      now,
    );

    insert.run(
      "usr_admin",
      "admin@solarsense.io",
      hashPassword("admin1234"),
      "SolarSense Operations Lead",
      "Central Operations Hub",
      10.0,
      "admin",
      now,
      now,
    );
  }
}

// User CRUD operations
export function getUserByEmail(email: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, email, password_hash, name, site, capacity_kw, role, created_at, updated_at FROM users WHERE email = ? COLLATE NOCASE;",
    )
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;

  if (!row) return null;
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    name: row.name as string,
    site: row.site as string,
    capacityKw: Number(row.capacity_kw),
    role: row.role as "admin" | "client",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, email, password_hash, name, site, capacity_kw, role, created_at, updated_at FROM users WHERE id = ?;",
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    name: row.name as string,
    site: row.site as string,
    capacityKw: Number(row.capacity_kw),
    role: row.role as "admin" | "client",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createUser(data: {
  email: string;
  password: string;
  name: string;
  site?: string;
  capacityKw?: number;
}): UserRecord {
  const db = getDb();
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const id = `usr_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();
  const hash = hashPassword(data.password);
  const site = data.site?.trim() || "Solar Array Site A";
  const capacity = data.capacityKw ?? 4.0;

  db.prepare(
    `
    INSERT INTO users (id, email, password_hash, name, site, capacity_kw, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'client', ?, ?);
  `,
  ).run(id, normalizedEmail, hash, data.name.trim(), site, capacity, now, now);

  return {
    id,
    email: normalizedEmail,
    passwordHash: hash,
    name: data.name.trim(),
    site,
    capacityKw: capacity,
    role: "client",
    createdAt: now,
    updatedAt: now,
  };
}

export function updateUserProfile(
  userId: string,
  updates: { name?: string; site?: string; capacityKw?: number },
): UserRecord {
  const db = getDb();
  const current = getUserById(userId);
  if (!current) throw new Error("User not found");

  const name = updates.name?.trim() ?? current.name;
  const site = updates.site?.trim() ?? current.site;
  const capacityKw = updates.capacityKw ?? current.capacityKw;
  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE users SET name = ?, site = ?, capacity_kw = ?, updated_at = ? WHERE id = ?;
  `,
  ).run(name, site, capacityKw, now, userId);

  return { ...current, name, site, capacityKw, updatedAt: now };
}

export function updateUserPassword(userId: string, newPassword: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  const hash = hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?;").run(
    hash,
    now,
    userId,
  );
}

// Session store
export function createSession(
  userId: string,
  meta?: { userAgent?: string; ipAddress?: string; durationSeconds?: number },
): string {
  const db = getDb();
  const duration = meta?.durationSeconds ?? 60 * 60 * 24 * 7; // 7 days
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  const exp = Math.floor(Date.now() / 1000) + duration;
  const token = signToken({ userId, email: user.email, exp });
  const now = new Date().toISOString();
  const expiresAt = new Date(exp * 1000).toISOString();

  db.prepare(
    `
    INSERT INTO sessions (token, user_id, created_at, expires_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?, ?);
  `,
  ).run(token, userId, now, expiresAt, meta?.userAgent || null, meta?.ipAddress || null);

  return token;
}

export function validateSession(token: string): UserRecord | null {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) {
    deleteSession(token);
    return null;
  }

  const db = getDb();
  const session = db
    .prepare("SELECT token, user_id, expires_at FROM sessions WHERE token = ?;")
    .get(token) as { token: string; user_id: string; expires_at: string } | undefined;

  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(token);
    return null;
  }

  return getUserById(session.user_id);
}

export function deleteSession(token: string): void {
  try {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?;").run(token);
  } catch {
    /* ignore */
  }
}

export function deleteUserSessions(userId: string): void {
  try {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE user_id = ?;").run(userId);
  } catch {
    /* ignore */
  }
}

// Audit logging
export function logAuditEvent(params: {
  userId?: string | null;
  email: string;
  action: string;
  success: boolean;
  details?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    const db = getDb();
    const id = `log_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO audit_logs (id, user_id, email, action, success, details, ip, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    ).run(
      id,
      params.userId ?? null,
      params.email,
      params.action,
      params.success ? 1 : 0,
      params.details ?? null,
      params.ip ?? null,
      params.userAgent ?? null,
      now,
    );
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export function getRecentAuditLogs(limit = 20): AuditLogRecord[] {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT id, user_id, email, action, success, details, ip, user_agent, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?;",
      )
      .all(limit) as Record<string, unknown>[];

    return rows.map((r) => ({
      id: r.id as string,
      userId: r.user_id as string | null,
      email: r.email as string,
      action: r.action as string,
      success: Number(r.success),
      details: r.details as string | null,
      ip: r.ip as string | null,
      userAgent: r.user_agent as string | null,
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}
