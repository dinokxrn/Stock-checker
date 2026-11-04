"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPin,
  verifyPin,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export interface AuthResponse {
  success: boolean;
  error?: string;
}

/**
 * Authenticates user with 4-digit numeric PIN and establishes session cookie
 */
export async function loginWithPin(pin: string): Promise<AuthResponse> {
  if (!pin || !/^\d{4}$/.test(pin)) {
    return { success: false, error: "รหัส PIN ต้องเป็นตัวเลข 4 หลัก" };
  }

  try {
    const pinSetting = await prisma.setting.findUnique({
      where: { key: "pin" },
    });

    const expectedHash = pinSetting?.value ?? hashPin("1234");
    const isValid = verifyPin(pin, expectedHash);

    if (!isValid) {
      return { success: false, error: "รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
    }

    const token = await createSessionToken();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login action error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน กรุณาลองใหม่" };
  }
}

/**
 * Destroys session cookie and redirects user to /login
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

/**
 * Changes PIN with current PIN verification and updates database
 */
export async function changePinAction(
  currentPin: string,
  newPin: string,
  confirmPin: string
): Promise<AuthResponse> {
  try {
    const pinSetting = await prisma.setting.findUnique({
      where: { key: "pin" },
    });
    const expectedHash = pinSetting?.value ?? hashPin("1234");

    if (!verifyPin(currentPin, expectedHash)) {
      return { success: false, error: "รหัส PIN ปัจจุบันไม่ถูกต้อง" };
    }

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return { success: false, error: "รหัส PIN ใหม่ต้องเป็นตัวเลข 4 หลัก" };
    }

    if (newPin !== confirmPin) {
      return { success: false, error: "รหัส PIN ใหม่และการยืนยันไม่ตรงกัน" };
    }

    if (currentPin === newPin) {
      return { success: false, error: "รหัส PIN ใหม่ต้องไม่ซ้ำกับรหัสเดิม" };
    }

    const newHash = hashPin(newPin);
    await prisma.setting.upsert({
      where: { key: "pin" },
      update: { value: newHash },
      create: { key: "pin", value: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error("Change PIN action error:", error);
    return { success: false, error: "ไม่สามารถบันทึกรหัส PIN ใหม่ได้ กรุณาลองใหม่" };
  }
}

/**
 * Checks if the current session is valid
 */
export async function checkAuth(): Promise<{ authenticated: boolean }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(sessionCookie);
  return { authenticated };
}
