"use client";

import { Shell } from "@/components/layout/Shell";
import { UserProvisioner } from "@/components/auth/UserProvisioner";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvisioner>
      <Shell>{children}</Shell>
    </UserProvisioner>
  );
}
