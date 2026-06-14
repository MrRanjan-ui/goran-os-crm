"use client";

import * as React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/Forms";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  ListTodo,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText as DocIcon
} from "lucide-react";

type Project = {
  _id: string;
  name: string;
  clientId: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority: string;
  scopeOfWork: string[];
  billingType?: "one-time" | "recurring" | "both";
  developmentCharge?: number;
  recurringFee?: number;
  recurringInterval?: "monthly" | "yearly";
};

type Task = {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Blocked" | "Done";
  priority: string;
  dueDate?: string;
};

type Invoice = {
  _id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  dueDate?: string;
  billingType?: "one-time" | "recurring";
  paymentCategory?: "development_charge" | "recurring_fee" | "other";
  recurringInterval?: "monthly" | "yearly";
  billingPeriod?: string;
};

type Document = {
  _id: string;
  title: string;
  url: string;
  type: string;
  linkedTo?: string;
  createdAt: string;
};

type Client = {
  _id: string;
  name: string;
  email: string;
  primaryContact: string;
  imageUrl?: string;
};

function formatCurrency(amount?: number) {
  if (amount === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<"tasks" | "billing" | "documents">("tasks");

  // Form local states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  
  // Invoice Form states
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceCategory, setInvoiceCategory] = useState<"development_charge" | "recurring_fee" | "other">("development_charge");
  const [invoiceStatus, setInvoiceStatus] = useState<"Draft" | "Sent" | "Paid">("Sent");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoicePeriod, setInvoicePeriod] = useState("");

  // Document Upload states
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState("contract");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Queries
  const { data: projectResponse, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Project }>(`/projects/${projectId}`, token);
    },
    enabled: !!projectId
  });

  const project = projectResponse?.data;

  const { data: clientResponse } = useQuery({
    queryKey: ["client-detail", project?.clientId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Client }>(`/clients/${project?.clientId}`, token);
    },
    enabled: !!project?.clientId
  });

  const client = clientResponse?.data;

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Task[] }>(`/tasks?projectId=${projectId}`, token);
    },
    enabled: !!projectId
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["project-invoices", projectId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Invoice[] }>(`/invoices?projectId=${projectId}`, token);
    },
    enabled: !!projectId
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Document[] }>(`/documents?linkedTo=${projectId}`, token);
    },
    enabled: !!projectId
  });

  const tasks = tasksData?.data ?? [];
  const invoices = invoicesData?.data ?? [];
  const documents = docsData?.data ?? [];

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status !== "Paid").reduce((sum, inv) => sum + inv.amount, 0);

  // Mutations

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const token = await getToken();
      return apiPost("/tasks", taskData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const token = await getToken();
      return apiPatch(`/tasks/${taskId}`, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken();
      return apiDelete(`/tasks/${taskId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    }
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const token = await getToken();
      return apiPost("/invoices", invoiceData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invoices", projectId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (docData: any) => {
      const token = await getToken();
      return apiPost("/documents", docData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const token = await getToken();
      return apiDelete(`/documents/${docId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    }
  });

  // Autofill invoice charge when category changes
  React.useEffect(() => {
    if (!project) return;
    if (invoiceCategory === "development_charge") {
      setInvoiceAmount(project.developmentCharge ? String(project.developmentCharge) : "");
    } else if (invoiceCategory === "recurring_fee") {
      setInvoiceAmount(project.recurringFee ? String(project.recurringFee) : "");
    } else {
      setInvoiceAmount("");
    }
  }, [invoiceCategory, project]);

  // Actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTaskMutation.mutateAsync({
      projectId,
      title: newTaskTitle.trim(),
      status: "Todo",
      priority: newTaskPriority
    });
    setNewTaskTitle("");
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const amount = Number(invoiceAmount);
    if (isNaN(amount) || amount <= 0) return;

    await createInvoiceMutation.mutateAsync({
      clientId: project.clientId,
      projectId: project._id,
      amount,
      status: invoiceStatus,
      dueDate: invoiceDueDate || undefined,
      currency: "USD",
      billingType: invoiceCategory === "recurring_fee" ? "recurring" : "one-time",
      paymentCategory: invoiceCategory,
      recurringInterval: invoiceCategory === "recurring_fee" ? project.recurringInterval : undefined,
      billingPeriod: invoiceCategory === "recurring_fee" ? invoicePeriod : undefined
    });

    setInvoiceAmount("");
    setInvoicePeriod("");
    setInvoiceDueDate("");
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !documentTitle.trim()) {
      alert("Please enter a document title first.");
      return;
    }

    try {
      setUploadingDoc(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const token = await getToken();
          // 1. Upload to MongoDB via API backend
          const uploadRes = await apiPost<{ data: { secure_url: string } }>("/uploads", {
            dataUrl,
            filename: file.name
          }, token);

          // 2. Link to Project in Documents Collection
          await createDocumentMutation.mutateAsync({
            title: documentTitle.trim(),
            url: uploadRes.data.secure_url,
            type: documentType,
            linkedTo: projectId
          });

          setDocumentTitle("");
        } catch (err) {
          console.error("Upload error:", err);
          alert("Failed to upload document. Please try again.");
        } finally {
          setUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingDoc(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Loading Project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
        <h3 className="text-white font-semibold text-lg">Project Not Found</h3>
        <p className="text-white/60 text-sm">This project may have been deleted or archived.</p>
        <Button onClick={() => router.push("/projects")} variant="outline">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/projects")}
          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-white/50 font-mono">Workspace / Project details</span>
      </div>

      {/* Main Metadata Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-accent/15 via-purple-500/5 to-transparent p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={getPriorityBadge(project.priority)}>{project.priority}</Badge>
              <Badge className={getStatusBadge(project.status)}>{project.status}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
            {client && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                {client.imageUrl ? (
                  <img src={client.imageUrl} className="h-6 w-6 rounded-full object-cover" alt={client.name} />
                ) : (
                  <Briefcase className="h-4 w-4 text-accent" />
                )}
                <span>Client:</span>
                <span className="text-white font-medium">{client.name}</span>
                <span className="text-white/40">({client.primaryContact})</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-2 text-xs text-white/50 font-mono">
            <div>Started: <span className="text-white">{formatDate(project.startDate)}</span></div>
            <div>Expected End: <span className="text-white">{formatDate(project.endDate)}</span></div>
          </div>
        </div>
      </div>

      {/* Grid Quick Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-white/40 text-xs font-semibold">Scope Progress</span>
          <span className="text-2xl font-bold text-white mt-1">{progressPercent}%</span>
          <div className="mt-3">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">
              {totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks done` : "No tasks added"}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-white/40 text-xs font-semibold">Setup / Dev Charge</span>
          <span className="text-2xl font-bold text-white mt-1">
            {project.developmentCharge ? formatCurrency(project.developmentCharge) : "N/A"}
          </span>
          <span className="text-[10px] text-white/40 mt-2 block">
            {project.billingType === "both" || project.billingType === "one-time" ? "One-time setup fee" : "No development charge"}
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-white/40 text-xs font-semibold">Recurring Retainer</span>
          <span className="text-2xl font-bold text-white mt-1">
            {project.recurringFee ? `${formatCurrency(project.recurringFee)}` : "N/A"}
          </span>
          <span className="text-[10px] text-white/40 mt-2 block">
            {project.recurringInterval ? `Billed ${project.recurringInterval}` : "No recurring retainer"}
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-white/40 text-xs font-semibold">Outstanding Collections</span>
          <span className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[10px] text-emerald-400 mt-2 block">
            {formatCurrency(totalPaid)} paid of {formatCurrency(totalInvoiced)} total
          </span>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-white/5 pb-px gap-4">
        {[
          { id: "tasks", label: `Tasks & Progress (${totalTasks})`, icon: ListTodo },
          { id: "billing", label: "Billing & Invoices", icon: DollarSign },
          { id: "documents", label: `Documents (${documents.length})`, icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? "text-accent" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeDetailTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">

          {/* TAB 2: TASKS & PROGRESS */}
          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Task Creation Form */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <h4 className="text-sm font-semibold text-white mb-3">Record New Project Task</h4>
                <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="taskTitle" className="text-[11px] text-white/40">Task Title</Label>
                    <Input
                      id="taskTitle"
                      required
                      placeholder="e.g. Wireframe project detail templates"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="h-9 py-1 px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="taskPriority" className="text-[11px] text-white/40">Priority</Label>
                    <Select
                      id="taskPriority"
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Select>
                  </div>
                  <Button type="submit" size="sm" className="h-9 shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                </form>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-12 bg-white/5 rounded-lg" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
                    No active tasks found. Record one above to get started.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-white/5">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {task.status === "Done" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                          )}
                          <div>
                            <span className={`text-sm ${task.status === "Done" ? "line-through text-white/40" : "text-white font-medium"}`}>
                              {task.title}
                            </span>
                            <div className="flex gap-2 items-center mt-1">
                              <Badge className={`text-[9px] px-1.5 py-px border border-white/10 ${
                                task.priority === "Urgent" ? "bg-rose-500/10 text-rose-400" :
                                task.priority === "High" ? "bg-amber-500/10 text-amber-400" :
                                "bg-white/5 text-white/50"
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="flex flex-wrap gap-1 bg-black/30 p-1 rounded-lg border border-white/10 shrink-0">
                            {(["Todo", "In Progress", "Blocked", "Done"] as const).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateTaskMutation.mutate({ taskId: task._id, data: { status } })}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  task.status === status
                                    ? status === "Done"
                                      ? "bg-emerald-500 text-white shadow-sm"
                                      : status === "In Progress"
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : status === "Blocked"
                                      ? "bg-rose-500 text-white shadow-sm"
                                      : "bg-white/20 text-white shadow-sm"
                                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              if (confirm("Delete this task?")) {
                                deleteTaskMutation.mutate(task._id);
                              }
                            }}
                            className="text-white/40 hover:text-rose-400 p-1.5 rounded hover:bg-white/5 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: BILLING & PAYMENTS */}
          {activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Billing Configuration Detail Panel */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-4 border-accent/20 bg-accent/5">
                  <h4 className="text-xs text-white/50 uppercase font-semibold">Active Billing Model</h4>
                  <span className="text-lg font-bold text-white mt-1 block capitalize">
                    {project.billingType === "both" ? "Development + Retainer" : 
                     project.billingType === "recurring" ? "Recurring Retainer Only" : "One-Time Development"}
                  </span>
                </Card>
                {(project.billingType === "one-time" || project.billingType === "both") && (
                  <Card className="p-4">
                    <h4 className="text-xs text-white/50 uppercase font-semibold">Configured Dev Charge</h4>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {project.developmentCharge ? formatCurrency(project.developmentCharge) : "Not Configured"}
                    </span>
                  </Card>
                )}
                {(project.billingType === "recurring" || project.billingType === "both") && (
                  <Card className="p-4">
                    <h4 className="text-xs text-white/50 uppercase font-semibold">Configured Retainer</h4>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {project.recurringFee ? `${formatCurrency(project.recurringFee)} / ${project.recurringInterval}` : "Not Configured"}
                    </span>
                  </Card>
                )}
              </div>

              {/* Invoice Creator Form */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <h4 className="text-sm font-semibold text-white mb-3">Record or Issue Payment Invoice</h4>
                <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-[11px] text-white/40">Invoice Category</Label>
                    <Select
                      id="category"
                      value={invoiceCategory}
                      onChange={e => setInvoiceCategory(e.target.value as any)}
                      className="h-9 text-xs"
                    >
                      <option value="development_charge">Development Charge</option>
                      <option value="recurring_fee">Recurring Fee</option>
                      <option value="other">Other Charge</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invoiceAmount" className="text-[11px] text-white/40">Amount ($)</Label>
                    <Input
                      id="invoiceAmount"
                      required
                      type="number"
                      min="1"
                      placeholder="Amount in USD"
                      value={invoiceAmount}
                      onChange={e => setInvoiceAmount(e.target.value)}
                      className="h-9 py-1 px-3 text-xs"
                    />
                  </div>

                  {invoiceCategory === "recurring_fee" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="invoicePeriod" className="text-[11px] text-white/40">Billing Period Cycle</Label>
                      <Input
                        id="invoicePeriod"
                        required
                        placeholder="e.g. June 2026"
                        value={invoicePeriod}
                        onChange={e => setInvoicePeriod(e.target.value)}
                        className="h-9 py-1 px-3 text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="invoiceDueDate" className="text-[11px] text-white/40">Due Date</Label>
                    <Input
                      id="invoiceDueDate"
                      type="date"
                      value={invoiceDueDate}
                      onChange={e => setInvoiceDueDate(e.target.value)}
                      className="h-9 py-1 px-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invoiceStatus" className="text-[11px] text-white/40">Initial Status</Label>
                    <Select
                      id="invoiceStatus"
                      value={invoiceStatus}
                      onChange={e => setInvoiceStatus(e.target.value as any)}
                      className="h-9 text-xs"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                    </Select>
                  </div>

                  <Button type="submit" size="sm" className="h-9 shrink-0 sm:col-start-4">
                    <Plus className="h-4 w-4 mr-1" /> Record Payment
                  </Button>
                </form>
              </div>

              {/* Payments History */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Project Payments Ledger</h4>
                {invoicesLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse h-12 bg-white/5 rounded-lg" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
                    No billing logs found for this project.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-white/5">
                    {invoices.map((inv) => (
                      <div
                        key={inv._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <span className="text-sm text-white font-semibold">
                              {formatCurrency(inv.amount)} {inv.currency}
                            </span>
                            <div className="flex flex-wrap gap-2 items-center mt-0.5">
                              <Badge className="bg-white/5 text-white/50 border border-white/10 text-[9px] px-1 py-px capitalize">
                                {inv.paymentCategory ? inv.paymentCategory.replace("_", " ") : "Invoice"}
                              </Badge>
                              {inv.billingPeriod && (
                                <span className="text-[10px] text-accent font-medium">Cycle: {inv.billingPeriod}</span>
                              )}
                              <span className="text-[10px] text-white/40">
                                Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <Badge className={`text-[10px] px-2 py-0.5 border ${
                            inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            inv.status === "Sent" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            inv.status === "Overdue" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-white/5 text-white/50 border-white/10"
                          }`}>
                            {inv.status}
                          </Badge>

                          <Select
                            value={inv.status}
                            onChange={async (e) => {
                              const token = await getToken();
                              await apiPatch(`/invoices/${inv._id}`, { status: e.target.value }, token);
                              queryClient.invalidateQueries({ queryKey: ["project-invoices", projectId] });
                            }}
                            className="h-8 py-0.5 text-[11px] bg-black/40 border border-white/5 text-white"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: DOCUMENTS MANAGER */}
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Document upload form */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <h4 className="text-sm font-semibold text-white mb-3">Upload Project Document</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="docTitle" className="text-[11px] text-white/40">Document Title / Name</Label>
                    <Input
                      id="docTitle"
                      placeholder="e.g. Project NOC, Agreement"
                      value={documentTitle}
                      onChange={e => setDocumentTitle(e.target.value)}
                      className="h-9 py-1 px-3 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="docType" className="text-[11px] text-white/40">Document Category</Label>
                    <Select
                      id="docType"
                      value={documentType}
                      onChange={e => setDocumentType(e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="contract">Project Contract</option>
                      <option value="noc">NOC (No Objection Certificate)</option>
                      <option value="proposal">Welcome Document / Proposal</option>
                      <option value="sop">Technical SOP / Manual</option>
                      <option value="other">Other Reference File</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="docFile" className="text-[11px] text-white/40">Choose File</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="docFile"
                        type="file"
                        onChange={handleUploadDocument}
                        disabled={uploadingDoc}
                        className="text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer focus:outline-none w-full"
                      />
                      {uploadingDoc && (
                        <span className="text-xs text-accent animate-pulse shrink-0">Uploading...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Stored Document Attachments</h4>
                {docsLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse h-12 bg-white/5 rounded-lg" />
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
                    No documents linked to this project. Upload project documents above.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <Card key={doc._id} className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-transform">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <DocIcon className="h-4 w-4 text-accent" />
                            </div>
                            <Badge className="bg-white/5 text-white/60 border border-white/10 text-[9px] uppercase">
                              {doc.type}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-semibold text-white leading-snug line-clamp-1">{doc.title}</h4>
                          <span className="text-[10px] text-white/40 font-mono block mt-1">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <button
                            onClick={() => {
                              if (confirm("Delete this document?")) {
                                deleteDocumentMutation.mutate(doc._id);
                              }
                            }}
                            className="text-xs text-rose-400/80 hover:text-rose-400 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline flex items-center gap-1"
                          >
                            View File <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
