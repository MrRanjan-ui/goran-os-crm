import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string | null;
        sessionId?: string | null;
        orgId?: string | null;
        token?: string | null;
      };
      user?: {
        id: string;
        clerkUserId: string;
        role: string;
      };
    }
  }
}
