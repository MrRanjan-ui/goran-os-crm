"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/Forms";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  IndianRupee,
  Briefcase,
  ListTodo,
  CheckCircle2
} from "lucide-react";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  clientName: string;
}

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
  status: "Draft" | "Sent" | "Due" | "Paid" | "Overdue";
  dueDate?: string;
};

export function ProjectDetailModal({ isOpen, onClose, project, clientName }: ProjectDetailModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Tab management: "scope" | "tasks" | "billing"
  const [activeTab, setActiveTab] = useState<"scope" | "tasks" | "billing">("scope");

  // Local state for forms
  const [newScopeItem, setNewScopeItem] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("");
  const [newInvoiceStatus, setNewInvoiceStatus] = useState("Due");
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState("");

  // Fetch Tasks for this project
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", project?._id],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Task[] }>(`/tasks?projectId=${project._id}`, token);
    },
    enabled: !!project?._id
  });

  // Fetch Invoices for this project
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["project-invoices", project?._id],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ data: Invoice[] }>(`/invoices?projectId=${project._id}`, token);
    },
    enabled: !!project?._id
  });

  const tasks = tasksData?.data ?? [];
  const invoices = invoicesData?.data ?? [];

  // Computed progress metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

  // Invoice calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status !== "Paid").reduce((sum, inv) => sum + inv.amount, 0);

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const token = await getToken();
      return apiPatch(`/projects/${project._id}`, updatedData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const token = await getToken();
      return apiPost("/tasks", taskData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project?._id] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const token = await getToken();
      return apiPatch(`/tasks/${taskId}`, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project?._id] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken();
      return apiDelete(`/tasks/${taskId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project?._id] });
    }
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const token = await getToken();
      return apiPost("/invoices", invoiceData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invoices", project?._id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: any }) => {
      const token = await getToken();
      return apiPatch(`/invoices/${invoiceId}`, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invoices", project?._id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  // Action handlers
  const handleAddScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScopeItem.trim()) return;
    const currentScope = project.scopeOfWork ?? [];
    const updatedScope = [...currentScope, newScopeItem.trim()];
    await updateProjectMutation.mutateAsync({ scopeOfWork: updatedScope });
    setNewScopeItem("");
  };

  const handleToggleScopeCheckbox = async (idx: number, isCurrentlyChecked: boolean) => {
    // We can simulate checking items by prefixing or formatting them,
    // but a cleaner way is storing checked status. Since scope is just string[],
    // let's prefix completed items with "[x] " or store them as they are.
    // For simplicity, let's treat items prefixed with "[x] " as completed.
    const currentScope = [...(project.scopeOfWork ?? [])];
    const item = currentScope[idx];
    if (isCurrentlyChecked) {
      // Uncheck it: remove "[x] " prefix
      currentScope[idx] = item.replace(/^\[x\]\s*/, "");
    } else {
      // Check it: add "[x] " prefix
      currentScope[idx] = `[x] ${item}`;
    }
    await updateProjectMutation.mutateAsync({ scopeOfWork: currentScope });
  };

  const handleDeleteScope = async (idx: number) => {
    const currentScope = (project.scopeOfWork ?? []).filter((_: any, i: number) => i !== idx);
    await updateProjectMutation.mutateAsync({ scopeOfWork: currentScope });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTaskMutation.mutateAsync({
      projectId: project._id,
      title: newTaskTitle.trim(),
      status: "Todo",
      priority: newTaskPriority
    });
    setNewTaskTitle("");
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskMutation.mutateAsync({ taskId, data: { status: newStatus } });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newInvoiceAmount);
    if (isNaN(amount) || amount <= 0) return;
    await createInvoiceMutation.mutateAsync({
      clientId: project.clientId,
      projectId: project._id,
      amount,
      status: newInvoiceStatus,
      dueDate: newInvoiceDueDate || undefined,
      currency: "INR"
    });
    setNewInvoiceAmount("");
    setNewInvoiceDueDate("");
  };

  const handleInvoiceStatusChange = async (invoiceId: string, newStatus: string) => {
    await updateInvoiceMutation.mutateAsync({ invoiceId, data: { status: newStatus } });
  };

  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal content container */}
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass relative w-full max-w-4xl rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div>
              <span className="text-xs text-accent font-semibold uppercase tracking-wider">Master CRM Workspace</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">{project.name}</h2>
              <p className="text-sm text-white/50 mt-1">Client: <span className="text-white/80 font-medium">{clientName}</span></p>
            </div>

            {/* Metrics Quickbar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-sm">
              <div>
                <span className="text-white/40 block text-xs">Work Progress</span>
                <span className="text-white font-semibold text-base mt-0.5 block">
                  {taskProgressPercent !== null ? `${taskProgressPercent}%` : `${project.status} status`}
                </span>
                <span className="text-[10px] text-white/30">
                  {totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks done` : "No tasks added"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-xs">Project Budget</span>
                <span className="text-white font-semibold text-base mt-0.5 block">
                  {project.budget ? `₹${project.budget.toLocaleString()}` : "Not Set"}
                </span>
                <span className="text-[10px] text-white/30">Contract value</span>
              </div>
              <div>
                <span className="text-white/40 block text-xs">Total Invoiced</span>
                <span className="text-white font-semibold text-base mt-0.5 block text-blue-400">
                  {totalInvoiced ? `₹${totalInvoiced.toLocaleString()}` : "₹0"}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {totalPaid ? `₹${totalPaid.toLocaleString()} paid` : "₹0 paid"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-xs">Pending Payments</span>
                <span className="text-white font-semibold text-base mt-0.5 block text-rose-400">
                  {totalPending ? `₹${totalPending.toLocaleString()}` : "₹0"}
                </span>
                <span className="text-[10px] text-white/30">Outstanding collections</span>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-white/5 pb-px gap-4">
              {[
                { id: "scope", label: "Scope & Deliverables", icon: Briefcase },
                { id: "tasks", label: `Tasks & Progress (${totalTasks})`, icon: ListTodo },
                { id: "billing", label: `Billing & Payments`, icon: IndianRupee }
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
                        layoutId="activeWorkspaceTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {/* 1. SCOPE AND DELIVERABLES TAB */}
                {activeTab === "scope" && (
                  <motion.div
                    key="scope-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-white font-medium text-base">Project Scope Checklist</h3>
                        <p className="text-xs text-white/50">Add scope specifications, milestone markers, and sign-offs.</p>
                      </div>

                      <form onSubmit={handleAddScope} className="flex gap-2 w-full md:w-auto">
                        <Input
                          placeholder="New deliverable name..."
                          value={newScopeItem}
                          onChange={e => setNewScopeItem(e.target.value)}
                          className="h-9 py-1 px-3 text-sm min-w-[200px]"
                        />
                        <Button type="submit" size="sm" className="h-9 px-3 shrink-0">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </form>
                    </div>

                    <div className="space-y-2 mt-2">
                      {(project.scopeOfWork ?? []).map((item: string, idx: number) => {
                        const isDone = item.startsWith("[x] ");
                        const displayItem = isDone ? item.substring(4) : item;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleScopeCheckbox(idx, isDone)}
                                className="text-white/60 hover:text-accent transition-colors"
                              >
                                {isDone ? (
                                  <CheckSquare className="h-5 w-5 text-accent" />
                                ) : (
                                  <Square className="h-5 w-5" />
                                )}
                              </button>
                              <span className={`text-sm ${isDone ? "line-through text-white/40" : "text-white"}`}>
                                {displayItem}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteScope(idx)}
                              className="text-white/40 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}

                      {(!project.scopeOfWork || project.scopeOfWork.length === 0) && (
                        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/35 text-sm">
                          No scope deliverables defined yet. Add items above to specify the project bounds.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 2. TASKS & WORK PROGRESS TAB */}
                {activeTab === "tasks" && (
                  <motion.div
                    key="tasks-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Inline Task Creation Form */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <h4 className="text-sm text-white font-medium mb-3">Add Project Task</h4>
                      <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2 space-y-1.5">
                          <Label htmlFor="taskTitle" className="text-[11px] text-white/40">Task Title</Label>
                          <Input
                            id="taskTitle"
                            required
                            placeholder="e.g. Set up API endpoints"
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

                    {/* Task Lists */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-white">Active Task List</h4>
                        {taskProgressPercent !== null && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            {completedTasks} / {totalTasks} Tasks Done ({taskProgressPercent}%)
                          </Badge>
                        )}
                      </div>

                      {tasksLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse h-12 bg-white/5 rounded-lg" />
                          ))}
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/35 text-sm">
                          No tasks associated with this project. Use the form above to add one.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-white/5">
                          {tasks.map((task) => (
                            <div
                              key={task._id}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 gap-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {task.status === "Done" ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                                <div>
                                  <span className={`text-sm ${task.status === "Done" ? "line-through text-white/40" : "text-white font-medium"}`}>
                                    {task.title}
                                  </span>
                                  <div className="flex gap-2 items-center mt-1">
                                    <Badge className={`text-[9px] px-1 py-px border border-white/10 ${
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
                                <Select
                                  value={task.status}
                                  onChange={e => handleTaskStatusChange(task._id, e.target.value)}
                                  className="h-8 py-0.5 text-[11px] bg-black/40 border border-white/5 text-white"
                                >
                                  <option value="Todo">Todo</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Blocked">Blocked</option>
                                  <option value="Done">Done</option>
                                </Select>

                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="text-white/40 hover:text-rose-400 p-1.5 rounded hover:bg-white/5 transition-all"
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

                {/* 3. BILLING & PAYMENTS TAB */}
                {activeTab === "billing" && (
                  <motion.div
                    key="billing-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Invoice Creator Form */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <h4 className="text-sm text-white font-medium mb-3">Issue Project Invoice</h4>
                      <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                          <Label htmlFor="invoiceAmount" className="text-[11px] text-white/40">Amount ($)</Label>
                          <Input
                            id="invoiceAmount"
                            required
                            type="number"
                            min="1"
                            placeholder="Amount in USD"
                            value={newInvoiceAmount}
                            onChange={e => setNewInvoiceAmount(e.target.value)}
                            className="h-9 py-1 px-3 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="invoiceStatus" className="text-[11px] text-white/40">Status</Label>
                          <Select
                            id="invoiceStatus"
                            value={newInvoiceStatus}
                            onChange={e => setNewInvoiceStatus(e.target.value)}
                            className="h-9 text-xs"
                          >
                            <option value="Due">Due</option>
                            <option value="Paid">Paid</option>
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Overdue">Overdue</option>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="invoiceDueDate" className="text-[11px] text-white/40">Due Date</Label>
                          <Input
                            id="invoiceDueDate"
                            type="date"
                            value={newInvoiceDueDate}
                            onChange={e => setNewInvoiceDueDate(e.target.value)}
                            className="h-9 py-1 px-3 text-xs text-white"
                          />
                        </div>
                        <Button type="submit" size="sm" className="h-9 shrink-0">
                          <Plus className="h-4 w-4 mr-1" /> Issue
                        </Button>
                      </form>
                    </div>

                    {/* Invoice Lists */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white">Billing Records</h4>

                      {invoicesLoading ? (
                        <div className="space-y-2">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="animate-pulse h-12 bg-white/5 rounded-lg" />
                          ))}
                        </div>
                      ) : invoices.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/35 text-sm">
                          No invoices generated for this project yet. Use the issuer above to generate one.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-white/5">
                          {invoices.map((inv) => (
                            <div
                              key={inv._id}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 gap-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                  <IndianRupee className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <span className="text-sm text-white font-semibold">
                                    ₹{inv.amount.toLocaleString()} INR
                                  </span>
                                  <span className="text-[10px] text-white/40 block">
                                    Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "No Date"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <Badge className={`text-[10px] px-2 py-0.5 border ${
                                  inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  (inv.status === "Sent" || inv.status === "Due") ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                  inv.status === "Overdue" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                  "bg-white/5 text-white/50 border-white/10"
                                }`}>
                                  {inv.status}
                                </Badge>

                                <Select
                                  value={inv.status}
                                  onChange={e => handleInvoiceStatusChange(inv._id, e.target.value)}
                                  className="h-8 py-0.5 text-[11px] bg-black/40 border border-white/5 text-white"
                                >
                                  <option value="Due">Due</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Draft">Draft</option>
                                  <option value="Sent">Sent</option>
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
              </AnimatePresence>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <Button onClick={onClose} variant="outline" className="text-xs">
                Close Workspace
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
