"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api";

export function UserProvisioner({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function provision() {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        const token = await getToken();
        await apiPost("/users/provision", {
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name: user.fullName ?? user.username ?? "Anonymous User"
        }, token);
        setIsProvisioned(true);
      } catch (err: any) {
        console.error("Failed to provision user:", err);
        setError(err.message || "Failed to initialize user session");
      }
    }

    if (isLoaded && isSignedIn) {
      provision();
    } else if (isLoaded && !isSignedIn) {
      // If not signed in, we don't need to provision, let Clerk handle redirect
      setIsProvisioned(true);
    }
  }, [isLoaded, isSignedIn, user, getToken]);

  if (!isLoaded || (!isProvisioned && !error)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium">Initializing your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass rounded-xl border border-red-500/20 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Connection Error</h2>
          <p className="text-white/60 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors border border-red-500/30 text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
