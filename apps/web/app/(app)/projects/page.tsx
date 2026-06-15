"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Edit2, Trash2, Plus } from "lucide-react";
import { ProjectModal } from "./ProjectModal";
import { ProjectDetailModal } from "./ProjectDetailModal";

type Project = {
  _id: string;
  name: string;
  clientId: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority: string;
  billingType?: string;
  developmentCharge?: number;
  recurringFee?: number;
  recurringInterval?: string;
  recurringPaymentDate?: string;
  recurringPaymentStatus?: string;
};

type ProjectsResponse = {
  data: Project[];
};

type Client = {
  _id: string;
  name: string;
};

type ClientsResponse = {
  data: Client[];
};

function formatCurrency(amount?: number) {
  if (amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getPriorityBadge(priority: string) {
  const priorityStyles: Record<string, string> = {
    Low: "bg-white/5 text-white/50 border-white/10",
    Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Critical: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };
  return priorityStyles[priority] || "bg-white/5 text-white/70";
}

function getStatusBadge(status: string) {
  const statusStyles: Record<string, string> = {
    Active: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Paused: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Cancelled: "bg-white/5 text-white/40 border-white/10"
  };
  return statusStyles[status] || "bg-white/5 text-white/70";
}

function getProgressPercent(status: string) {
  const progressMap: Record<string, number> = {
    Paused: 15,
    Active: 55,
    Completed: 100,
    Cancelled: 0
  };
  return progressMap[status] || 0;
}

function getRiskRadarInfo(project: Project) {
  if ((project.priority === "Urgent" || project.priority === "High") && project.status === "Active") {
    return {
      message: "AI Alert: Critical dependency delay potential detected in milestones.",
      style: "text-rose-400 bg-rose-500/5 border-rose-500/10"
    };
  }
  if (project.priority === "High" && project.status === "Paused") {
    return {
      message: "AI Notice: Fast-track scheduling recommended to optimize resources.",
      style: "text-amber-400 bg-amber-500/5 border-amber-500/10"
    };
  }
  return {
    message: "AI Check: Project is healthy and progressing within margin thresholds.",
    style: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
  };
}

export default function ProjectsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any | null>(null);

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ProjectsResponse>("/projects", token ?? undefined);
    }
  });

  // Fetch clients to resolve names
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients-lookup"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ClientsResponse>("/clients", token ?? undefined);
    }
  });

  // Fetch all tasks for dynamic progress calculation
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["all-projects-tasks"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: any[] }>("/tasks", token ?? undefined);
    }
  });

  // Fetch all invoices for billing metrics
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["all-projects-invoices"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: any[] }>("/invoices", token ?? undefined);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return apiPost("/projects", data, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      return apiPatch(`/projects/${id}`, data, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiDelete(`/projects/${id}`, token ?? undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const isLoading = projectsLoading || clientsLoading || tasksLoading || invoicesLoading;
  const isError = projectsError;

  const projects = projectsData?.data ?? [];
  const clients = clientsData?.data ?? [];

  const clientMap = new Map<string, string>(
    clients.map(c => [c._id, c.name])
  );

  const allTasks = tasksData?.data ?? [];
  const tasksByProject = allTasks.reduce<Record<string, any[]>>((acc, t) => {
    if (!acc[t.projectId]) acc[t.projectId] = [];
    acc[t.projectId].push(t);
    return acc;
  }, {});

  const allInvoices = invoicesData?.data ?? [];
  const invoicesByProject = allInvoices.reduce<Record<string, any[]>>((acc, inv) => {
    if (inv.projectId) {
      if (!acc[inv.projectId]) acc[inv.projectId] = [];
      acc[inv.projectId].push(inv);
    }
    return acc;
  }, {});

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject._id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Milestones, approvals, and AI risk detection."
        badge="Risk Radar"
        action={
          <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse glass rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-16" />
              </div>
              <div className="h-3 bg-white/5 rounded w-1/4" />
              <div className="h-2 bg-white/5 rounded w-full mt-4" />
              <div className="flex justify-between pt-4 border-t border-white/5">
                <div className="h-4 bg-white/5 rounded w-20" />
                <div className="h-4 bg-white/5 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load projects data. Please try again later.</p>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/50 mb-4">No projects found. Create one to get started.</p>
          <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} variant="outline">
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => {
            const clientName = clientMap.get(project.clientId) || "Unknown Client";
            
            // Dynamic task progress calculation
            const projectTasks = tasksByProject[project._id] ?? [];
            const totalProjTasks = projectTasks.length;
            const completedProjTasks = projectTasks.filter(t => t.status === "Done").length;
            const progress = totalProjTasks > 0 
              ? Math.round((completedProjTasks / totalProjTasks) * 100) 
              : getProgressPercent(project.status);

            // Dynamic billing calculation
            const projectInvoices = invoicesByProject[project._id] ?? [];
            const billedAmt = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const paidAmt = projectInvoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);

            const riskInfo = getRiskRadarInfo(project);

            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => router.push(`/projects/${project._id}`)}
                  className="hover:scale-[1.005] transition-transform duration-200 cursor-pointer flex flex-col justify-between h-full group relative overflow-hidden"
                >
                  {/* Hover Actions */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-black/40 hover:bg-white/10"
                      onClick={(e) => handleEdit(e, project)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-white/70" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-black/40 hover:bg-rose-500/20 hover:text-rose-400"
                      onClick={(e) => handleDelete(e, project._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white/70 hover:text-rose-400" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-start justify-between pr-20">
                      <div>
                        <h3 className="text-white font-medium text-lg group-hover:text-accent transition-colors duration-150">
                          {project.name}
                        </h3>
                        <p className="text-sm text-accent mt-0.5">{clientName}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Badge className={`border ${getPriorityBadge(project.priority)}`}>
                        {project.priority}
                      </Badge>
                      <Badge className={`border ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-white/40">Completion</span>
                        <span className="text-white/80 font-medium">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-550"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {totalProjTasks > 0 ? `${completedProjTasks} of ${totalProjTasks} tasks completed` : "No tasks assigned"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5 text-sm">
                      <div>
                        <span className="block text-xs text-white/40 mb-0.5">Budget & Billing</span>
                        <span className="text-white font-medium">{formatCurrency(project.budget)}</span>
                        {billedAmt > 0 && (
                          <span className="block text-[10px] text-white/50 mt-0.5">
                            Billed: {formatCurrency(billedAmt)} | Paid: {formatCurrency(paidAmt)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs text-white/40 mb-0.5">Timeline</span>
                        <span className="text-white text-xs">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-5 p-3 rounded-lg border ${riskInfo.style} text-xs flex items-center gap-2`}>
                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>{riskInfo.message}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={editingProject}
          clients={clients}
          onSubmit={handleSubmit}
        />
      )}

      {selectedProjectForDetail && (
        <ProjectDetailModal
          isOpen={!!selectedProjectForDetail}
          onClose={() => setSelectedProjectForDetail(null)}
          project={selectedProjectForDetail}
          clientName={clientMap.get(selectedProjectForDetail.clientId) || "Unknown Client"}
        />
      )}
    </div>
  );
}
