import { getSession } from "../../../../lib/auth";
import { successResponse, unauthorizedResponse } from "../../../../lib/api-response";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return unauthorizedResponse();
  }

  return successResponse(session);
}
