"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/Forms";
import { Modal } from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  Plus,
  Search,
  AlertCircle,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";

type Invoice = {
  _id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: "Draft" | "Sent" | "Due" | "Paid" | "Overdue";
  dueDate?: string;
  billingType?: "one-time" | "recurring";
  paymentCategory?: "development_charge" | "recurring_fee" | "other";
  recurringInterval?: "monthly" | "yearly";
  billingPeriod?: string;
  createdAt: string;
};

type Expense = {
  _id: string;
  vendor: string;
  amount: number;
  currency: string;
  category?: string;
  incurredOn?: string;
  description?: string;
  createdAt: string;
};

type Client = {
  _id: string;
  name: string;
  email: string;
};

type Project = {
  _id: string;
  name: string;
  clientId: string;
};

type Transaction =
  | {
      type: "inflow";
      id: string;
      date: string;
      amount: number;
      category: string;
      status: string;
      clientName: string;
      projectName?: string;
      invoice: Invoice;
    }
  | {
      type: "outflow";
      id: string;
      date: string;
      amount: number;
      category: string;
      description?: string;
      vendor: string;
      expense: Expense;
    };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    Draft: "bg-white/5 text-white/50 border-white/10",
    Sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Due: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Overdue: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };
  return styles[status] || "bg-white/5 text-white/70";
}

export default function PaymentsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "inflow" | "outflow">("all");

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Transaction form type switcher
  const [transactionType, setTransactionType] = useState<"inflow" | "outflow">("inflow");

  // Client Payment (Inflow) Form States
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [inflowAmount, setInflowAmount] = useState("");
  const [inflowStatus, setInflowStatus] = useState<"Draft" | "Sent" | "Due" | "Paid" | "Overdue">("Due");
  const [inflowCategory, setInflowCategory] = useState<"development_charge" | "recurring_fee" | "other">("development_charge");
  const [inflowDueDate, setInflowDueDate] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("");

  // Company Expense (Outflow) Form States
  const [outflowVendor, setOutflowVendor] = useState("");
  const [outflowAmount, setOutflowAmount] = useState("");
  const [outflowCategory, setOutflowCategory] = useState("");
  const [outflowDescription, setOutflowDescription] = useState("");
  const [outflowIncurredDate, setOutflowIncurredDate] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: invoicesRes, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => apiGet<{ data: Invoice[] }>("/invoices", await getToken())
  });

  const { data: expensesRes, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => apiGet<{ data: Expense[] }>("/expenses", await getToken())
  });

  const { data: clientsRes } = useQuery({
    queryKey: ["clients-lookup"],
    queryFn: async () => apiGet<{ data: Client[] }>("/clients", await getToken())
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: async () => apiGet<{ data: Project[] }>("/projects", await getToken())
  });

  const invoices = invoicesRes?.data ?? [];
  const expenses = expensesRes?.data ?? [];
  const clients = clientsRes?.data ?? [];
  const projects = projectsRes?.data ?? [];

  // Mappings
  const clientMap = new Map(clients.map((c) => [c._id, c]));
  const projectMap = new Map(projects.map((p) => [p._id, p]));

  // Available projects for the selected client
  const availableProjects = projects.filter((p) => p.clientId === selectedClientId);

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const token = await getToken();
      return apiPost("/invoices", invoiceData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const token = await getToken();
      return apiPost("/expenses", expenseData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      return apiPatch(`/invoices/${id}`, { status }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiDelete(`/invoices/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiDelete(`/expenses/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    }
  });

  // Calculate Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = invoices.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter((inv) => inv.status !== "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutflows = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalCollected - totalOutflows;

  // Reset form inputs
  const resetForm = () => {
    setSelectedClientId("");
    setSelectedProjectId("");
    setInflowAmount("");
    setInflowStatus("Due");
    setInflowCategory("development_charge");
    setInflowDueDate("");
    setBillingPeriod("");

    setOutflowVendor("");
    setOutflowAmount("");
    setOutflowCategory("");
    setOutflowDescription("");
    setOutflowIncurredDate("");
  };

  // Submit Handler
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (transactionType === "inflow") {
        if (!selectedClientId) {
          alert("Please select a client.");
          setIsSaving(false);
          return;
        }
        const amt = Number(inflowAmount);
        if (isNaN(amt) || amt <= 0) {
          alert("Please enter a valid positive amount.");
          setIsSaving(false);
          return;
        }

        await createInvoiceMutation.mutateAsync({
          clientId: selectedClientId,
          projectId: selectedProjectId || undefined,
          amount: amt,
          currency: "INR",
          status: inflowStatus,
          dueDate: inflowDueDate || undefined,
          paymentCategory: inflowCategory,
          billingType: inflowCategory === "recurring_fee" ? "recurring" : "one-time",
          billingPeriod: inflowCategory === "recurring_fee" ? billingPeriod : undefined
        });
      } else {
        if (!outflowVendor.trim()) {
          alert("Please enter a vendor/item name.");
          setIsSaving(false);
          return;
        }
        const amt = Number(outflowAmount);
        if (isNaN(amt) || amt <= 0) {
          alert("Please enter a valid positive amount.");
          setIsSaving(false);
          return;
        }

        await createExpenseMutation.mutateAsync({
          vendor: outflowVendor.trim(),
          amount: amt,
          currency: "INR",
          category: outflowCategory || "Other",
          incurredOn: outflowIncurredDate || undefined,
          description: outflowDescription.trim() || undefined
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to record transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  // Combine Invoices and Expenses
  const allTransactions: Transaction[] = [];

  invoices.forEach((inv) => {
    const client = clientMap.get(inv.clientId);
    const project = inv.projectId ? projectMap.get(inv.projectId) : null;
    allTransactions.push({
      type: "inflow",
      id: inv._id,
      date: inv.createdAt || inv.dueDate || new Date().toISOString(),
      amount: inv.amount,
      category: inv.paymentCategory ? inv.paymentCategory.replace("_", " ") : "Invoice",
      status: inv.status,
      clientName: client?.name || "Unknown Client",
      projectName: project?.name,
      invoice: inv
    });
  });

  expenses.forEach((exp) => {
    allTransactions.push({
      type: "outflow",
      id: exp._id,
      date: exp.incurredOn || exp.createdAt || new Date().toISOString(),
      amount: exp.amount,
      category: exp.category || "Expense",
      description: exp.description,
      vendor: exp.vendor,
      expense: exp
    });
  });

  // Sort by date (newest first)
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter Transactions
  const filteredTransactions = allTransactions.filter((tx) => {
    // Tab Filter
    if (activeTab === "inflow" && tx.type !== "inflow") return false;
    if (activeTab === "outflow" && tx.type !== "outflow") return false;

    // Search Term Filter
    const query = searchTerm.toLowerCase();
    let matchesSearch = false;
    if (tx.type === "inflow") {
      matchesSearch =
        tx.clientName.toLowerCase().includes(query) ||
        (tx.projectName?.toLowerCase().includes(query) ?? false) ||
        tx.id.toLowerCase().includes(query);
    } else {
      matchesSearch =
        tx.vendor.toLowerCase().includes(query) ||
        (tx.description?.toLowerCase().includes(query) ?? false) ||
        tx.id.toLowerCase().includes(query);
    }

    // Status Filter (only applies to inflows)
    const matchesStatus =
      statusFilter === "All" ||
      (tx.type === "inflow" && tx.status === statusFilter) ||
      (tx.type === "outflow");

    // Category Filter
    const matchesCategory =
      categoryFilter === "All" ||
      (tx.type === "inflow" && tx.invoice.paymentCategory === categoryFilter) ||
      (tx.type === "outflow" && tx.expense.category === categoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Payments & Expenses"
          description="Log and monitor client payments (inflows) and company expenses (outflows) in one workspace."
          badge="Ledger Console"
        />
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Record Transaction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-semibold">Collected Revenue (Inflow)</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-white mt-3">{formatCurrency(totalCollected)}</span>
          <span className="text-[10px] text-emerald-400 mt-1 block">Settled invoices</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-semibold">Total Expenses (Outflow)</span>
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-rose-400 mt-3">{formatCurrency(totalOutflows)}</span>
          <span className="text-[10px] text-rose-400/50 mt-1 block">Hardware, SaaS, fees</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-semibold">Net profit</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <span className={`text-2xl font-bold mt-3 ${netProfit >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
            {formatCurrency(netProfit)}
          </span>
          <span className="text-[10px] text-white/40 mt-1 block">Revenue minus expenses</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-semibold">Outstanding Collections</span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-400 mt-3">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[10px] text-white/40 mt-1 block">Unpaid invoices: {formatCurrency(totalInvoiced)} total</span>
        </Card>
      </div>

      {/* Ledger Feed Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-4">
        {[
          { id: "all", label: "All Transactions" },
          { id: "inflow", label: "Client Inflows" },
          { id: "outflow", label: "Company Expenses" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter("All");
              setCategoryFilter("All");
              setActiveTab(tab.id as any);
            }}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? "text-accent" : "text-white/40 hover:text-white/60"
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeLedgerTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Filtering Options */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 w-full md:max-w-md">
          <Search className="h-4 w-4 text-white/50" />
          <input
            placeholder={activeTab === "outflow" ? "Search by vendor, reason..." : "Search by client, project name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-white/80 outline-none placeholder-white/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {activeTab !== "outflow" && (
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs min-w-[125px]"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </Select>
          )}

          {activeTab !== "outflow" ? (
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 text-xs min-w-[150px]"
            >
              <option value="All">All Categories</option>
              <option value="development_charge">Development Charge</option>
              <option value="recurring_fee">Recurring Fee</option>
              <option value="other">Other Charge</option>
            </Select>
          ) : (
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 text-xs min-w-[150px]"
            >
              <option value="All">All Categories</option>
              <option value="Software">Software / SaaS</option>
              <option value="Marketing">Marketing / Ads</option>
              <option value="API Usage">API Usage</option>
              <option value="Hardware">Hardware</option>
              <option value="Other">Other Expenses</option>
            </Select>
          )}
        </div>
      </Card>

      {/* Main Ledger Table */}
      <Card className="overflow-hidden">
        {invoicesLoading || expensesLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/40 text-sm">Loading ledger sheets...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-white/20 mx-auto" />
            <h4 className="text-white font-medium text-base">No Transactions Found</h4>
            <p className="text-white/45 text-sm max-w-sm mx-auto">
              No financial logs found matching your filters. Click "Record Transaction" to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-white/50">
                  <th className="p-4 font-semibold w-10">Type</th>
                  <th className="p-4 font-semibold">Transaction ID</th>
                  <th className="p-4 font-semibold">Details / Party</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold">Category / Notes</th>
                  <th className="p-4 font-semibold">Transaction Date</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                <AnimatePresence>
                  {filteredTransactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-center">
                        {tx.type === "inflow" ? (
                          <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto" title="Inflow (Client Payment)">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto" title="Outflow (Company Expense)">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-white/40">#{tx.id.substring(16)}</td>
                      <td className="p-4">
                        {tx.type === "inflow" ? (
                          <div>
                            <span className="block text-white font-semibold">{tx.clientName}</span>
                            {tx.projectName && (
                              <span className="text-[10px] text-white/40">Project: {tx.projectName}</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="block text-white font-semibold">{tx.vendor}</span>
                            {tx.description && (
                              <span className="text-[10px] text-white/45 flex items-center gap-1 mt-0.5">
                                <Info className="h-3 w-3 text-white/30 shrink-0" />
                                <span className="line-clamp-1 max-w-[200px]" title={tx.description}>{tx.description}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={`p-4 text-right font-bold text-sm ${tx.type === "inflow" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "inflow" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4 space-y-1">
                        <Badge className="bg-white/5 text-white/50 border border-white/10 text-[9px] px-1 py-px capitalize">
                          {tx.category}
                        </Badge>
                        {tx.type === "inflow" && tx.invoice.billingPeriod && (
                          <span className="block text-[10px] text-accent font-medium">Cycle: {tx.invoice.billingPeriod}</span>
                        )}
                      </td>
                      <td className="p-4 text-white/50">{formatDate(tx.date)}</td>
                      <td className="p-4 text-center">
                        {tx.type === "inflow" ? (
                          <Badge className={`border text-[10px] px-2 py-0.5 ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-2 py-0.5">
                            Outflow
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {tx.type === "inflow" ? (
                            <>
                              <Select
                                value={tx.status}
                                onChange={(e) => updateStatusMutation.mutate({ id: tx.id, status: e.target.value })}
                                className="h-8 py-0.5 text-[10px] bg-black/40 border border-white/10 text-white min-w-[85px]"
                              >
                                <option value="Due">Due</option>
                                <option value="Paid">Paid</option>
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Overdue">Overdue</option>
                              </Select>

                              <button
                                onClick={() => {
                                  if (confirm("Delete this invoice record permanently?")) {
                                    deleteInvoiceMutation.mutate(tx.id);
                                  }
                                }}
                                className="text-white/40 hover:text-rose-400 p-1.5 rounded hover:bg-white/5 transition-colors shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm("Delete this expense record permanently?")) {
                                  deleteExpenseMutation.mutate(tx.id);
                                }
                              }}
                              className="text-white/40 hover:text-rose-400 p-1.5 rounded hover:bg-white/5 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" /> Delete Expense
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Unified Transaction Recorder Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Ledger Transaction">
        <form onSubmit={handleSaveTransaction} className="space-y-4 pt-2">
          {/* Switcher */}
          <div className="space-y-1.5">
            <Label>Transaction Category Type</Label>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setTransactionType("inflow")}
                className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  transactionType === "inflow"
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Client Payment (Inflow)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("outflow")}
                className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  transactionType === "outflow"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" /> Company Expense (Outflow)
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <AnimatePresence mode="wait">
              {transactionType === "inflow" ? (
                <motion.div
                  key="inflow-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="formClient">Client *</Label>
                      <Select
                        id="formClient"
                        required={transactionType === "inflow"}
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                          setSelectedProjectId("");
                        }}
                      >
                        <option value="">-- Select Client --</option>
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="formProject">Associated Project</Label>
                      <Select
                        id="formProject"
                        disabled={!selectedClientId}
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                      >
                        <option value="">-- No Project (Client-wide) --</option>
                        {availableProjects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="formInflowCategory">Inflow Category</Label>
                      <Select
                        id="formInflowCategory"
                        value={inflowCategory}
                        onChange={(e) => setInflowCategory(e.target.value as any)}
                      >
                        <option value="development_charge">Development / Setup Charge</option>
                        <option value="recurring_fee">Recurring Subscription / Retainer</option>
                        <option value="other">Other Charge</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="formInflowAmount">Amount (USD) *</Label>
                      <Input
                        id="formInflowAmount"
                        type="number"
                        min="1"
                        required={transactionType === "inflow"}
                        placeholder="e.g. 2500"
                        value={inflowAmount}
                        onChange={(e) => setInflowAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="formInflowDueDate">Due Date</Label>
                      <Input
                        id="formInflowDueDate"
                        type="date"
                        value={inflowDueDate}
                        onChange={(e) => setInflowDueDate(e.target.value)}
                        className="text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="formInflowStatus">Status</Label>
                      <Select
                        id="formInflowStatus"
                        value={inflowStatus}
                        onChange={(e) => setInflowStatus(e.target.value as any)}
                      >
                        <option value="Due">Due (Unpaid)</option>
                        <option value="Paid">Paid (Settled)</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                      </Select>
                    </div>
                  </div>

                  {inflowCategory === "recurring_fee" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="formBillingPeriod">Billing Period / Cycle</Label>
                      <Input
                        id="formBillingPeriod"
                        required={inflowCategory === "recurring_fee"}
                        placeholder="e.g. June 2026, Q2 2026"
                        value={billingPeriod}
                        onChange={(e) => setBillingPeriod(e.target.value)}
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="outflow-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="formOutflowVendor">Vendor / Item Name *</Label>
                      <Input
                        id="formOutflowVendor"
                        required={transactionType === "outflow"}
                        placeholder="e.g. OpenAI, Vercel, Office Supplies"
                        value={outflowVendor}
                        onChange={(e) => setOutflowVendor(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="formOutflowAmount">Amount (USD) *</Label>
                      <Input
                        id="formOutflowAmount"
                        type="number"
                        min="1"
                        required={transactionType === "outflow"}
                        placeholder="e.g. 150"
                        value={outflowAmount}
                        onChange={(e) => setOutflowAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="formOutflowCategory">Expense Category</Label>
                      <Select
                        id="formOutflowCategory"
                        value={outflowCategory}
                        onChange={(e) => setOutflowCategory(e.target.value)}
                      >
                        <option value="">-- Choose Category --</option>
                        <option value="Software">Software / SaaS</option>
                        <option value="Marketing">Marketing / Ads</option>
                        <option value="API Usage">API Usage</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Other">Other Expense</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="formOutflowDate">Incurred On Date</Label>
                      <Input
                        id="formOutflowDate"
                        type="date"
                        value={outflowIncurredDate}
                        onChange={(e) => setOutflowIncurredDate(e.target.value)}
                        className="text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="formOutflowDesc">Reason / Description of Expense *</Label>
                    <textarea
                      id="formOutflowDesc"
                      required={transactionType === "outflow"}
                      placeholder="e.g. Monthly Vercel bandwidth charges and database hosting costs..."
                      value={outflowDescription}
                      onChange={(e) => setOutflowDescription(e.target.value)}
                      rows={3}
                      className="w-full text-xs bg-black/40 border border-white/10 rounded-lg p-2.5 outline-none focus:border-accent text-white placeholder-white/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Recording..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
