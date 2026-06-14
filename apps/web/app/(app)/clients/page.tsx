"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Edit2, Trash2, Plus } from "lucide-react";
import { ClientModal } from "./ClientModal";

type Client = {
  _id: string;
  name: string;
  primaryContact: string;
  email: string;
  phone?: string;
  industry?: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
  website?: string;
  address?: string;
  notes?: string;
};

type ClientsResponse = {
  data: Client[];
  meta: {
    total: number;
  };
};

// Helper to determine gradient class based on name characters
function getAvatarGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  const gradients = [
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  return gradients[code % gradients.length];
}

// Map client names to mock/computed AI Sentiment states for visual richness
function getSentimentBadge(name: string) {
  const sentimentMap: Record<string, { label: string; style: string }> = {
    "Acme Corp": { label: "Excellent Relationship", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    "Stark Industries": { label: "High Engagement", style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    "Wayne Enterprises": { label: "Stable Partnership", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    "Globex Corporation": { label: "Growing Value", style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    "Initech": { label: "Retention Risk", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  };
  return sentimentMap[name] || { label: "Stable Partnership", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
}

export default function ClientsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ClientsResponse>("/clients", token ?? undefined);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const token = await getToken();
      return apiPost("/clients", clientData, token ?? undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup-fin"] });
      queryClient.invalidateQueries({ queryKey: ["clients-comms"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, clientData }: { id: string; clientData: any }) => {
      const token = await getToken();
      return apiPatch(`/clients/${id}`, clientData, token ?? undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup-fin"] });
      queryClient.invalidateQueries({ queryKey: ["clients-comms"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiDelete(`/clients/${id}`, token ?? undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["clients-lookup-fin"] });
      queryClient.invalidateQueries({ queryKey: ["clients-comms"] });
    }
  });

  const clients = data?.data ?? [];

  const handleEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this client profile? All associated projects and invoices will remain but client data will be soft-archived.")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (clientData: any) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient._id, clientData });
    } else {
      await createMutation.mutateAsync(clientData);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Profiles, contracts, and AI relationship insights."
        badge="Sentiment"
        action={
          <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load clients data. Please try again later.</p>
        </Card>
      ) : clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/50 mb-4">No clients found. Create one to get started.</p>
          <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} variant="outline">
            Create Client
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client, index) => {
            const initials = client.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            
            const sentiment = getSentimentBadge(client.name);
            const isClientActive = client.status.toLowerCase() === "active";

            return (
              <motion.div
                key={client._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:scale-[1.01] transition-transform duration-200 cursor-pointer flex flex-col justify-between h-full group relative overflow-hidden">
                  {/* Hover Actions */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-black/40 hover:bg-white/10"
                      onClick={(e) => handleEdit(e, client)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-white/70" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-black/40 hover:bg-rose-500/20 hover:text-rose-400"
                      onClick={(e) => handleDelete(e, client._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white/70 hover:text-rose-400" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-start justify-between mb-4 pr-16">
                      <div className="flex items-center gap-4">
                        {client.imageUrl ? (
                          <img
                            src={client.imageUrl}
                            alt={client.name}
                            className="h-12 w-12 rounded-full object-cover shadow-lg border border-white/10"
                          />
                        ) : (
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarGradient(client.name)} flex items-center justify-center font-bold text-white shadow-lg`}>
                            {initials}
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-medium group-hover:text-accent transition-colors duration-150">
                            {client.name}
                          </h3>
                          <span className="text-xs text-white/50">{client.industry || "General Industry"}</span>
                        </div>
                      </div>
                      <Badge className={isClientActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 animate-pulse" : "bg-white/5 text-white/40 border-white/10"}>
                        {client.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5 text-sm">
                      <div className="flex items-center justify-between text-white/60">
                        <span className="text-xs text-white/40">Contact:</span>
                        <span>{client.primaryContact}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/60">
                        <span className="text-xs text-white/40">Email:</span>
                        <a href={`mailto:${client.email}`} className="hover:underline hover:text-accent transition-colors">
                          {client.email}
                        </a>
                      </div>
                      {client.phone && (
                        <div className="flex items-center justify-between text-white/60">
                          <span className="text-xs text-white/40">Phone:</span>
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.website && (
                        <div className="flex items-center justify-between text-white/60">
                          <span className="text-xs text-white/40">Website:</span>
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-accent transition-colors truncate max-w-[150px]">
                            {client.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center justify-between text-white/60">
                          <span className="text-xs text-white/40">Location:</span>
                          <span className="truncate max-w-[150px]">{client.address}</span>
                        </div>
                      )}
                    </div>
                    {client.notes && (
                      <div className="mt-3 bg-white/5 p-2.5 rounded text-[11px] text-white/50 border border-white/5 italic line-clamp-2">
                        {client.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/40">AI Health Audit</span>
                    <Badge className={`border ${sentiment.style}`}>
                      {sentiment.label}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          client={editingClient}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
