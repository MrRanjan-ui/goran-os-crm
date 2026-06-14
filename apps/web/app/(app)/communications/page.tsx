"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Calendar, Clock, Users } from "lucide-react";

type Meeting = {
  _id: string;
  title: string;
  clientId?: string;
  scheduledAt: string;
  notes?: string;
  aiSummary?: string;
};

type MeetingsResponse = {
  data: Meeting[];
};

type Client = {
  _id: string;
  name: string;
};

type ClientsResponse = {
  data: Client[];
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  };
}

function getMeetingStatus(scheduledAt: string) {
  const now = new Date();
  const meetingDate = new Date(scheduledAt);
  if (meetingDate < now) return { label: "Completed", style: "bg-white/5 text-white/40 border-white/10" };
  const hoursDiff = (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursDiff < 24) return { label: "Today", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  return { label: "Upcoming", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
}

export default function CommunicationsPage() {
  const { getToken } = useAuth();

  const { data: meetingsData, isLoading: meetingsLoading, error } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<MeetingsResponse>("/meetings", token);
    }
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients-comms"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ClientsResponse>("/clients", token);
    }
  });

  const isLoading = meetingsLoading || clientsLoading;
  const meetings = meetingsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const clientMap = new Map(clients.map(c => [c._id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Communications"
        description="Meetings, notes, and AI-generated summaries."
        badge="AI Assistant"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-20" />
              </div>
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load meetings data. Please try again later.</p>
        </Card>
      ) : meetings.length === 0 ? (
        <Card>
          <p className="text-sm text-white/50 text-center py-6">No meetings scheduled. Seed the database to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => {
            const { date, time } = formatDateTime(meeting.scheduledAt);
            const status = getMeetingStatus(meeting.scheduledAt);
            const clientName = meeting.clientId ? clientMap.get(meeting.clientId) : null;

            return (
              <motion.div
                key={meeting._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <Card className="hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{meeting.title}</h3>
                        <Badge className={`border text-[10px] px-1.5 py-0.5 ${status.style}`}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {time}
                        </span>
                        {clientName && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> {clientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(meeting.notes || meeting.aiSummary) && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      {meeting.notes && (
                        <div>
                          <span className="text-[10px] text-white/40 font-medium">Notes:</span>
                          <p className="text-xs text-white/60 mt-0.5">{meeting.notes}</p>
                        </div>
                      )}
                      {meeting.aiSummary && (
                        <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                          <span className="text-[10px] text-accent font-medium">AI Summary:</span>
                          <p className="text-xs text-white/70 mt-0.5">{meeting.aiSummary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
