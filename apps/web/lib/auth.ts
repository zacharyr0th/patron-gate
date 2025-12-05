import { cookies } from "next/headers";
import { UserService } from "@repo/database";

export interface AuthSession {
  userId: string;
  walletAddress: string;
  isCreator: boolean;
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const walletAddress = cookieStore.get("wallet_address")?.value;

  if (!walletAddress) {
    return null;
  }

  const user = await UserService.getByWallet(walletAddress);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    walletAddress: user.walletAddress,
    isCreator: user.isCreator,
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireCreator(): Promise<AuthSession> {
  const session = await requireAuth();
  if (!session.isCreator) {
    throw new Error("Creator access required");
  }
  return session;
}

export async function setSession(walletAddress: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("wallet_address", walletAddress, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("wallet_address");
}
