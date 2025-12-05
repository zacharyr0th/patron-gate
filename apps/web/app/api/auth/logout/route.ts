import { clearSession } from "../../../../lib/auth";
import { successResponse } from "../../../../lib/api-response";

export async function POST() {
  await clearSession();
  return successResponse({ message: "Logged out successfully" });
}
