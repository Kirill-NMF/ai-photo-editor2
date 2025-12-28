import { db } from "./db";
import { users } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

export const API_LIMIT_FREE = 11;
export const PROMO_CODE = "вот тебе пряник";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  isLastEdit: boolean;
  resetDate: Date;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const userData = user[0];

  if (userData.isAdmin === true) {
    return {
      allowed: true,
      remaining: 999,
      isLastEdit: false,
      resetDate: new Date(),
    };
  }

  const now = new Date();
  let resetDate = userData.apiRequestsResetDate;

  if (!resetDate) {
    resetDate = new Date(now);
    resetDate.setMonth(resetDate.getMonth() + 1);
    
    await db.update(users)
      .set({ apiRequestsResetDate: resetDate })
      .where(eq(users.id, userId));
  } else if (now >= resetDate) {
    const nextResetDate = new Date(resetDate);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    
    await db.update(users)
      .set({
        apiRequestsCount: 0,
        apiRequestsResetDate: nextResetDate,
      })
      .where(eq(users.id, userId));
    
    resetDate = nextResetDate;
    userData.apiRequestsCount = 0;
  }

  const currentCount = userData.apiRequestsCount || 0;
  const limit = API_LIMIT_FREE;
  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed: currentCount < limit,
    remaining,
    isLastEdit: currentCount === limit - 1,
    resetDate,
  };
}

export async function incrementRateLimit(userId: string): Promise<void> {
  await db.update(users)
    .set({
      apiRequestsCount: sql`COALESCE(${users.apiRequestsCount}, 0) + 1`,
    })
    .where(eq(users.id, userId));
}

export function isPromoCode(prompt: string): boolean {
  return prompt.trim().toLowerCase() === PROMO_CODE.toLowerCase();
}

export async function applyPromoCode(userId: string): Promise<{ success: boolean; message: string }> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || user.length === 0) {
    return { success: false, message: "User not found" };
  }

  const userData = user[0];

  if (userData.promoCodeUsed === true) {
    return {
      success: false,
      message: "Промо-код уже был использован ранее",
    };
  }

  await db.update(users)
    .set({
      apiRequestsCount: 0,
      promoCodeUsed: true,
    })
    .where(eq(users.id, userId));

  return {
    success: true,
    message: "Спасибо за пряник. Теперь я сыт и могу служить дальше",
  };
}
