"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPatch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

type Automation = {
  _id: string;
  name: string;
  trigger: string;
  webhookUrl: string;
  enabled: boolean;
  createdAt: string;
};

type AutomationsResponse = {
  data: Automation[];
};

type AiLog = {
  _id: string;
  category: string;
  prompt: string;
  response: string;
  model?: string;
  createdAt: string;
};

type AiLogsResponse = {
  data: AiLog[];
};


export default function AutomationsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"workflows" | "audit">("workflows");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch automations
  const { data: automationsData, isLoading: automationsLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<AutomationsResponse>("/automations", token);
    }
  });

  // Fetch AI audit logs
  const { data: aiLogsData, isLoading: aiLogsLoading } = useQuery({
    queryKey: ["ai-logs"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<AiLogsResponse>("/ai-logs", token);
    }
  });

  // Mutation to toggle automation enabled state
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const token = await getToken();
      return apiPatch<Automation>(`/automations/${id}`, { enabled }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    }
  });

  const automations = automationsData?.data ?? [];
  const aiLogs = aiLogsData?.data ?? [];

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, enabled: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Trigger-based workflows and AI engine audit trails."
        badge="Webhook Ready"
      />

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-4">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "workflows" ? "text-accent" : "text-white/40 hover:text-white/60"
          }`}
        >
          Workflow Automations
          {activeTab === "workflows" && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "audit" ? "text-accent" : "text-white/40 hover:text-white/60"
          }`}
        >
          AI Audit Logs
          {activeTab === "audit" && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "workflows" ? (
          <motion.div
            key="workflows-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {automationsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-4">
                    <div className="flex justify-between">
                      <div className="h-5 bg-white/5 rounded w-1/3" />
                      <div className="h-5 bg-white/5 rounded w-12" />
                    </div>
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                    <div className="h-10 bg-white/5 rounded w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : automations.length === 0 ? (
              <Card>
                <p className="text-sm text-white/50 text-center py-6">No automations found. Seed the database to load workflows.</p>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {automations.map((auto, idx) => (
                  <motion.div
                    key={auto._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                  >
                    <Card className="hover:border-white/10 transition-colors flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-medium">{auto.name}</h3>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] mt-1.5">
                              trigger: {auto.trigger}
                            </Badge>
                          </div>
                          {/* Toggle switch custom element */}
                          <button
                            onClick={() => handleToggle(auto._id, auto.enabled)}
                            disabled={toggleMutation.isPending}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              auto.enabled ? "bg-accent" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                auto.enabled ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Webhook Url box */}
                        <div className="mt-4 bg-white/5 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs border border-white/5">
                          <span className="font-mono text-white/50 truncate max-w-[280px]">
                            {auto.webhookUrl}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(auto._id, auto.webhookUrl)}
                            className="text-[10px] h-7 px-2 border border-white/5 hover:border-white/10 text-white/70"
                          >
                            {copiedId === auto._id ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                        <span>Created: {new Date(auto.createdAt).toLocaleDateString()}</span>
                        <span className={auto.enabled ? "text-emerald-400 font-medium" : "text-white/30"}>
                          {auto.enabled ? "Active Syncing" : "Paused"}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="audit-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {aiLogsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-3">
                    <div className="h-5 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-12 bg-white/5 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : aiLogs.length === 0 ? (
              <Card>
                <p className="text-sm text-white/50 text-center py-6">No AI Audit logs found. Seed the database to view transcripts.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {aiLogs.map((log, idx) => {
                  const isExpanded = expandedLogId === log._id;

                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                    >
                      <Card className="hover:border-white/10 transition-colors p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                              {log.category}
                            </Badge>
                            {log.model && (
                              <span className="text-xs text-white/40 font-mono">{log.model}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/30">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Collapsible content */}
                        <div className="space-y-2 text-sm pt-2">
                          <div>
                            <span className="text-xs text-white/40 font-medium">Prompt:</span>
                            <p className="text-white/80 line-clamp-2 mt-0.5 bg-white/5 p-2 rounded font-mono text-xs border border-white/5">
                              {log.prompt}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-white/40 font-medium">Model Output:</span>
                            <div className={`mt-0.5 bg-black/20 p-3 rounded text-white/90 border border-white/5 text-xs font-mono whitespace-pre-wrap ${
                              isExpanded ? "" : "line-clamp-3"
                            }`}>
                              {log.response}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="text-[11px] h-7 px-3 text-accent hover:text-accent/80 hover:bg-white/5"
                          >
                            {isExpanded ? "Collapse Logs" : "Expand Output"}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
