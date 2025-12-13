import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import { auth } from "./auth";

type SessionPayload = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AuthenticatedUser = {
  session: SessionPayload["session"];
  authUser: SessionPayload["user"];
  profile: typeof users.$inferSelect;
};

export const readAuthenticatedUser = async (request: Request): Promise<AuthenticatedUser | null> => {
  const sessionResult = await auth.api.getSession({
    headers: request.headers,
  });

  if (!sessionResult) {
    return null;
  }

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionResult.user.id))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    session: sessionResult.session,
    authUser: sessionResult.user,
    profile,
  };
};



