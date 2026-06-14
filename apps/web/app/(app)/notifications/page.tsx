"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  data: Notification[];
};

function getTypeBadge(type: string) {
  const styles: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    automation: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  };
  return styles[type] || "bg-white/5 text-white/70";
}

export default function NotificationsPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<NotificationsResponse>("/notifications", token);
    }
  });

  const notifications = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Realtime alerts, overdue reminders, and AI recommendations."
        badge="Realtime"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-16" />
              </div>
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load notifications. Please try again later.</p>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <p className="text-sm text-white/50 text-center py-6">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif, index) => (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <Card className={`hover:border-white/10 transition-colors flex items-start gap-4 ${
                !notif.read ? "border-l-2 border-l-accent" : ""
              }`}>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-medium text-sm">{notif.title}</h3>
                    <Badge className={`border text-[10px] px-1.5 py-0.5 ${getTypeBadge(notif.type)}`}>
                      {notif.type}
                    </Badge>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="text-xs text-white/60">{notif.message}</p>
                  <span className="text-[10px] text-white/30 block">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
