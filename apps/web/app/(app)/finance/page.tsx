"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

type Invoice = {
  _id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidOn?: string;
};

type InvoicesResponse = {
  data: Invoice[];
};

type Expense = {
  _id: string;
  vendor: string;
  amount: number;
  currency: string;
  category?: string;
  incurredOn?: string;
};

type ExpensesResponse = {
  data: Expense[];
};

type Client = {
  _id: string;
  name: string;
};

type ClientsResponse = {
  data: Client[];
};

type Project = {
  _id: string;
  name: string;
};

type ProjectsResponse = {
  data: Project[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getInvoiceStatusBadge(status: string) {
  const styles: Record<string, string> = {
    Draft: "bg-white/5 text-white/50 border-white/10",
    Sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Overdue: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };
  return styles[status] || "bg-white/5 text-white/70";
}

export default function FinancePage() {
  const { getToken } = useAuth();

  // Fetch Invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<InvoicesResponse>("/invoices", token);
    }
  });

  // Fetch Expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ExpensesResponse>("/expenses", token);
    }
  });

  // Fetch Clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients-lookup-fin"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ClientsResponse>("/clients", token);
    }
  });

  // Fetch Projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects-lookup-fin"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ProjectsResponse>("/projects", token);
    }
  });

  const isLoading = invoicesLoading || expensesLoading || clientsLoading || projectsLoading;

  const invoices = invoicesData?.data ?? [];
  const expenses = expensesData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const projects = projectsData?.data ?? [];

  // Mappings
  const clientMap = new Map(clients.map(c => [c._id, c.name]));
  const projectMap = new Map(projects.map(p => [p._id, p.name]));

  // Aggregates
  const totalRevenue = invoices
    .filter(i => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPending = invoices
    .filter(i => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Revenue, expenses, and profitability analytics."
        badge="Forecasting"
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse glass h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse glass h-80 rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Revenue (Paid)", value: formatCurrency(totalRevenue), change: "Gross sales", positive: true },
              { label: "Total Expenses", value: formatCurrency(totalExpenses), change: "Hardware, SaaS & API", positive: false },
              { label: "Pending Funds", value: formatCurrency(totalPending), change: "Unpaid invoices", positive: true },
              { label: "Net Profit", value: formatCurrency(netProfit), change: `${marginPercent}% profit margin`, positive: netProfit >= 0 }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
              >
                <Card className="flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xs text-white/50 font-medium">{stat.label}</h3>
                    <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
                  </div>
                  <span className={`text-[10px] mt-2 block ${stat.positive ? "text-emerald-400" : "text-rose-400"}`}>
                    {stat.change}
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tables Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Invoices List */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-white font-medium text-sm">Client Invoices</h3>
                  <Badge className="bg-white/5 text-white/50 text-[10px]">{invoices.length} total</Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 pb-2 block w-full table-row">
                        <th className="pb-2 font-normal">Client & Project</th>
                        <th className="pb-2 font-normal text-right">Amount</th>
                        <th className="pb-2 font-normal text-center">Status</th>
                        <th className="pb-2 font-normal text-right">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-white/5 transition-colors table-row">
                          <td className="py-2.5">
                            <span className="block text-white font-medium">{clientMap.get(inv.clientId) || "Unknown Client"}</span>
                            <span className="text-[10px] text-white/45">{inv.projectId ? projectMap.get(inv.projectId) : "No project"}</span>
                          </td>
                          <td className="py-2.5 text-right font-medium text-white">{formatCurrency(inv.amount)}</td>
                          <td className="py-2.5 text-center">
                            <Badge className={`border text-[10px] px-1.5 py-0.5 ${getInvoiceStatusBadge(inv.status)}`}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right text-white/55">{formatDate(inv.dueDate)}</td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-white/30">No invoices records</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Expenses List */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-white font-medium text-sm">Vendor Expenses</h3>
                  <Badge className="bg-white/5 text-white/50 text-[10px]">{expenses.length} total</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 pb-2 block w-full table-row">
                        <th className="pb-2 font-normal">Vendor & Category</th>
                        <th className="pb-2 font-normal text-right">Amount</th>
                        <th className="pb-2 font-normal text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {expenses.map((exp) => (
                        <tr key={exp._id} className="hover:bg-white/5 transition-colors table-row">
                          <td className="py-2.5">
                            <span className="block text-white font-medium">{exp.vendor}</span>
                            {exp.category && (
                              <Badge className="bg-white/5 text-white/40 text-[9px] px-1.5 py-px mt-0.5">
                                {exp.category}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-medium text-white">{formatCurrency(exp.amount)}</td>
                          <td className="py-2.5 text-right text-white/55">{formatDate(exp.incurredOn)}</td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-white/30">No expenses records</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
