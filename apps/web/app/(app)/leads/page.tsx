"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

type Lead = {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  estimatedValue?: number;
  stage: string;
  notes?: string;
  aiScore?: number;
  aiProbability?: number;
};

type LeadsResponse = {
  data: Lead[];
};

const STAGES = ["New", "Contacted", "Discovery Call", "Proposal Sent", "Negotiation", "Won", "Lost"];

function formatCurrency(amount?: number) {
  if (amount === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function getAiScoreStyle(score?: number) {
  if (!score) return "bg-white/5 text-white/50 border-white/10";
  if (score >= 90) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
  if (score >= 80) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
  return "bg-amber-500/10 text-amber-400 border-amber-500/25";
}

export default function LeadsPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<LeadsResponse>("/leads", token);
    }
  });

  const leads = data?.data ?? [];

  // Group leads by stage
  const leadsByStage = STAGES.reduce<Record<string, Lead[]>>((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Pipeline"
        description="Track, score, and convert leads with AI guidance."
        badge="AI Lead Scoring"
      />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-7">
          {STAGES.map((stage) => (
            <div key={stage} className="space-y-4">
              <div className="h-6 bg-white/5 rounded w-1/2 animate-pulse mb-2" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse glass rounded-lg p-4 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded w-1/3 pt-2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load leads data. Please try again later.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-7 overflow-x-auto pb-4">
          {STAGES.map((stage, stageIdx) => {
            const stageLeads = leadsByStage[stage] ?? [];
            const stageValueTotal = stageLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);

            return (
              <div key={stage} className="min-w-[220px] flex flex-col space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-white font-medium text-sm">{stage}</h3>
                    <span className="text-[10px] text-white/40">{formatCurrency(stageValueTotal)} total</span>
                  </div>
                  <Badge className="bg-white/5 text-white/60 text-[10px] px-1.5 py-0.5">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 min-h-[300px]">
                  {stageLeads.map((lead, leadIdx) => (
                    <motion.div
                      key={lead._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: (stageIdx * 0.05) + (leadIdx * 0.05) }}
                    >
                      <Card className="hover:scale-[1.02] hover:border-accent/40 transition-all duration-200 cursor-pointer p-4 space-y-3 bg-card border border-white/5 group">
                        <div>
                          <h4 className="text-white font-medium text-xs group-hover:text-accent transition-colors duration-150">
                            {lead.companyName}
                          </h4>
                          <span className="text-[10px] text-white/50">{lead.contactName}</span>
                        </div>

                        <div className="text-white/80 font-semibold text-sm">
                          {formatCurrency(lead.estimatedValue)}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                          {lead.aiScore && (
                            <Badge className={`text-[10px] px-1.5 py-0.5 border ${getAiScoreStyle(lead.aiScore)}`}>
                              Score: {lead.aiScore}
                            </Badge>
                          )}
                          {lead.aiProbability !== undefined && (
                            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-1.5 py-0.5">
                              Win: {Math.round(lead.aiProbability * 100)}%
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-full border border-dashed border-white/5 rounded-lg flex items-center justify-center py-10">
                      <span className="text-[10px] text-white/30">No deals in stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
