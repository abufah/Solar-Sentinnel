import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  createSession,
  validateSession,
  deleteSession,
  logAuditEvent,
  updateUserProfile,
  updateUserPassword,
  getRecentAuditLogs,
  type UserRecord,
} from "./db";

const COOKIE_NAME = "solarsense_session";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  site: string;
  capacityKw: number;
  role: "admin" | "client";
  createdAt: string;
};

function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    site: user.site,
    capacityKw: user.capacityKw,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// 1. Get current authenticated user
export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(COOKIE_NAME);
  if (!token) return { user: null };

  const user = validateSession(token);
  if (!user) {
    deleteCookie(COOKIE_NAME, { path: "/" });
    return { user: null };
  }

  return { user: toSafeUser(user) };
});

// 2. Sign In
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signInServerFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => signInSchema.parse(d))
  .handler(async ({ data }) => {
    const userAgent = getRequestHeader("user-agent");
    const ip = getRequestHeader("x-forwarded-for");
    const email = data.email.trim().toLowerCase();

    const user = getUserByEmail(email);
    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      logAuditEvent({
        userId: user?.id ?? null,
        email,
        action: "login_failure",
        success: false,
        details: "Invalid email or password",
        ip,
        userAgent,
      });
      return { ok: false, error: "Invalid email or password." };
    }

    // Create session (7 days)
    const token = createSession(user.id, { userAgent, ipAddress: ip });

    setCookie(COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });

    logAuditEvent({
      userId: user.id,
      email: user.email,
      action: "login_success",
      success: true,
      details: `User signed in successfully into ${user.site}`,
      ip,
      userAgent,
    });

    return { ok: true, user: toSafeUser(user) };
  });

// 3. Sign Up
const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  site: z.string().optional(),
  capacityKw: z.number().positive().optional(),
});

export const signUpServerFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => signUpSchema.parse(d))
  .handler(async ({ data }) => {
    const userAgent = getRequestHeader("user-agent");
    const ip = getRequestHeader("x-forwarded-for");
    const email = data.email.trim().toLowerCase();

    try {
      const user = createUser({
        email,
        password: data.password,
        name: data.name,
        site: data.site,
        capacityKw: data.capacityKw,
      });

      const token = createSession(user.id, { userAgent, ipAddress: ip });

      setCookie(COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      });

      logAuditEvent({
        userId: user.id,
        email: user.email,
        action: "register_success",
        success: true,
        details: `New account registered for ${user.site}`,
        ip,
        userAgent,
      });

      return { ok: true, user: toSafeUser(user) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      logAuditEvent({
        email,
        action: "register_failure",
        success: false,
        details: msg,
        ip,
        userAgent,
      });
      return { ok: false, error: msg };
    }
  });

// 4. Sign Out
export const signOutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(COOKIE_NAME);
  if (token) {
    deleteSession(token);
  }
  deleteCookie(COOKIE_NAME, { path: "/" });
  return { ok: true };
});

// 5. Update Profile
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  site: z.string().min(2).optional(),
  capacityKw: z.number().positive().optional(),
});

export const updateProfileServerFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => updateProfileSchema.parse(d))
  .handler(async ({ data }) => {
    const token = getCookie(COOKIE_NAME);
    if (!token) return { ok: false, error: "Unauthorized" };

    const user = validateSession(token);
    if (!user) return { ok: false, error: "Unauthorized session" };

    try {
      const updated = updateUserProfile(user.id, data);
      return { ok: true, user: toSafeUser(updated) };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
    }
  });

// 6. Change Password
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

export const changePasswordServerFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => changePasswordSchema.parse(d))
  .handler(async ({ data }) => {
    const token = getCookie(COOKIE_NAME);
    if (!token) return { ok: false, error: "Unauthorized" };

    const user = validateSession(token);
    if (!user) return { ok: false, error: "Unauthorized session" };

    if (!verifyPassword(data.currentPassword, user.passwordHash)) {
      return { ok: false, error: "Current password is incorrect." };
    }

    updateUserPassword(user.id, data.newPassword);
    logAuditEvent({
      userId: user.id,
      email: user.email,
      action: "password_change",
      success: true,
      details: "User changed their password",
    });

    return { ok: true };
  });

// 7. Get Recent Audit Logs (Admin / telemetry transparency)
export const getAuditLogsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(COOKIE_NAME);
  if (!token) return { logs: [] };

  const user = validateSession(token);
  if (!user) return { logs: [] };

  return { logs: getRecentAuditLogs(15) };
});
