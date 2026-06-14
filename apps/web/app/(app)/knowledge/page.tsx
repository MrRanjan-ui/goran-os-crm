"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { FileText, Link as LinkIcon, ExternalLink } from "lucide-react";

type Document = {
  _id: string;
  title: string;
  url: string;
  type: string;
  linkedTo?: string;
  createdAt: string;
};

type DocumentsResponse = {
  data: Document[];
};

function getDocTypeBadge(type: string) {
  const styles: Record<string, string> = {
    contract: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    proposal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    sop: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    template: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };
  return styles[type] || "bg-white/5 text-white/70 border-white/10";
}

export default function KnowledgePage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<DocumentsResponse>("/documents", token);
    }
  });

  const documents = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Knowledge Base"
        description="Central SOPs, templates, and semantic search."
        badge="Semantic Search"
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-4">
              <div className="h-8 w-8 bg-white/5 rounded" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load documents. Please try again later.</p>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <p className="text-sm text-white/50 text-center py-6">No documents found. Upload SOPs, contracts, or templates to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:scale-[1.01] transition-transform duration-200 cursor-pointer group h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <Badge className={`border ${getDocTypeBadge(doc.type)}`}>
                      {doc.type}
                    </Badge>
                  </div>
                  <h3 className="text-white font-medium group-hover:text-accent transition-colors duration-150">
                    {doc.title}
                  </h3>
                  {doc.linkedTo && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                      <LinkIcon className="h-3 w-3" />
                      <span>Linked to: {doc.linkedTo}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
