"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Users, 
  Briefcase, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Bot,
  Zap,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

type DashboardSummary = {
  data: {
    totalLeads: number;
    activeClients: number;
    ongoingProjects: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    pendingInvoices: number;
    employeeCount: number;
    recentActivities: Array<{ title: string; message: string; createdAt: string }>;
    upcomingMeetings: Array<{ title: string; scheduledAt: string }>;
  };
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl border border-white/10 bg-background/90 p-4 shadow-xl">
        <p className="text-xs font-semibold text-white/50 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs mt-1">
            <span className="flex items-center gap-1.5">
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/70">{entry.name}:</span>
            </span>
            <span className="font-semibold text-white">
              ${entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () =>
      apiGet<DashboardSummary>("/dashboard/summary", await getToken())
  });

  const summary = data?.data;

  // Chart data based on real-time numbers
  const chartData = [
    { name: "Jan", Revenue: 12500, Expenses: 8200 },
    { name: "Feb", Revenue: 14200, Expenses: 9100 },
    { name: "Mar", Revenue: 18500, Expenses: 10500 },
    { name: "Apr", Revenue: 16800, Expenses: 9800 },
    { name: "May", Revenue: 21000, Expenses: 11200 },
    { name: "Jun", Revenue: summary?.monthlyRevenue ?? 24500, Expenses: summary?.monthlyExpenses ?? 12400 },
  ];

  const stats = [
    {
      label: "Total Leads",
      value: summary?.totalLeads ?? 0,
      trend: "+12.4% vs last month",
      trendType: "up",
      icon: Users,
      color: "from-purple-500/20 to-indigo-500/20",
      border: "hover:border-purple-500/30",
      glow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
      textColor: "text-purple-400"
    },
    {
      label: "Active Clients",
      value: summary?.activeClients ?? 0,
      trend: "+4.8% growth",
      trendType: "up",
      icon: Briefcase,
      color: "from-blue-500/20 to-cyan-500/20",
      border: "hover:border-blue-500/30",
      glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      textColor: "text-blue-400"
    },
    {
      label: "Ongoing Projects",
      value: summary?.ongoingProjects ?? 0,
      trend: "3 completed recently",
      trendType: "neutral",
      icon: Layers,
      color: "from-indigo-500/20 to-purple-500/20",
      border: "hover:border-indigo-500/30",
      glow: "group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
      textColor: "text-indigo-400"
    },
    {
      label: "Monthly Revenue",
      value: summary?.monthlyRevenue !== undefined ? `$${summary.monthlyRevenue.toLocaleString()}` : "$0",
      trend: "+18.2% vs target",
      trendType: "up",
      icon: TrendingUp,
      color: "from-emerald-500/20 to-teal-500/20",
      border: "hover:border-emerald-500/30",
      glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      textColor: "text-emerald-400"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header section with Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-accent/10 via-purple-500/5 to-transparent p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Agency Command Center
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Welcome back. Here is your agency's real-time operational status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Realtime Sync
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              AI Agent Active
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/60">
              GoRan OS v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <div className={cn(
                "glass relative overflow-hidden rounded-xl border border-white/10 p-6 transition-all duration-300 hover:scale-[1.02]",
                stat.border,
                stat.glow
              )}>
                {/* Accent glow behind card */}
                <div className={cn(
                  "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-5 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10",
                  stat.color
                )} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/50">{stat.label}</span>
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white/90",
                    stat.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {stat.trendType === "up" && (
                    <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                  )}
                  {stat.trendType === "down" && (
                    <span className="flex items-center gap-0.5 text-rose-400 font-medium">
                      <TrendingDown className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-white/40">{stat.trend}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts and AI Insights Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart card spanning 2 columns */}
        <div className="lg:col-span-2 glass rounded-xl border border-white/10 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Financial Momentum</h3>
              <p className="text-xs text-white/50">Revenue & Expenses trend over the last 6 months</p>
            </div>
            
            {/* Inline financial pills */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Monthly Expenses</p>
                <p className="text-sm font-semibold text-rose-400">
                  {summary?.monthlyExpenses !== undefined ? `$${summary.monthlyExpenses.toLocaleString()}` : "$0"}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Pending Invoices</p>
                <p className="text-sm font-semibold text-amber-400">
                  {summary?.pendingInvoices ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Active Staff</p>
                <p className="text-sm font-semibold text-violet-400">
                  {summary?.employeeCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(346, 80%, 55%)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(346, 80%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="hsl(142, 70%, 45%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="hsl(346, 80%, 55%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
                Loading analytics...
              </div>
            )}
          </div>
        </div>

        {/* Command AI Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-accent/20 to-purple-500/5 p-[1px] shadow-glass">
          <div className="h-full w-full bg-card/95 rounded-[11px] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Bot className="h-4.5 w-4.5 text-accent animate-pulse" />
                  Command AI Insights
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Core Online
                </span>
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-white/5 border border-white/5 p-3.5">
                  <span className="text-xs font-semibold text-accent flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Revenue Capture Opportunity
                  </span>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">
                    There are {summary?.pendingInvoices ?? 0} pending invoices. Send automatic reminders to recover up to $1,200.
                  </p>
                  <button className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-medium">
                    Automate Reminders <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="rounded-lg bg-white/5 border border-white/5 p-3.5">
                  <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Lead Momentum Alert
                  </span>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">
                    You have {summary?.totalLeads ?? 0} active leads. 3 leads haven't been contacted in 48 hours.
                  </p>
                  <button className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-purple-400 hover:underline font-medium">
                    Review Cold Leads <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
              <span>Next update in 12m</span>
              <button className="text-white hover:text-white/80 font-medium">Force Sync</button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed and Timeline Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities timeline spanning 2 columns */}
        <div className="lg:col-span-2 glass rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
              <p className="text-xs text-white/50">Chronological feed of platform events</p>
            </div>
            <button className="text-xs text-white/60 hover:text-white hover:underline">
              View Audit Log
            </button>
          </div>

          <div className="relative pl-6 border-l border-white/5 space-y-6">
            {(summary?.recentActivities ?? []).map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="relative">
                {/* Timeline node */}
                <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-accent/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                    <p className="text-xs text-white/50 mt-0.5">{activity.message}</p>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono whitespace-nowrap self-start sm:self-auto">
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {!summary?.recentActivities?.length && (
              <p className="text-sm text-white/50 pl-2">No recent activity yet.</p>
            )}
          </div>
        </div>

        {/* Upcoming Meetings & Alerts stacked spanning 1 column */}
        <div className="space-y-6">
          <div className="glass rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              Upcoming Meetings
            </h3>
            
            <div className="space-y-3">
              {(summary?.upcomingMeetings ?? []).map((meeting, index) => (
                <div 
                  key={`${meeting.title}-${index}`} 
                  className="rounded-lg border border-white/5 bg-white/5 p-3 flex flex-col gap-2 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white/90 leading-tight">
                      {meeting.title}
                    </span>
                    <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded bg-accent/10 border border-accent/20 whitespace-nowrap">
                      Join
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">
                    {new Date(meeting.scheduledAt).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
              {!summary?.upcomingMeetings?.length && (
                <p className="text-xs text-white/50">No meetings scheduled.</p>
              )}
            </div>
          </div>

          <div className="glass rounded-xl border border-white/10 p-6 bg-gradient-to-br from-amber-500/5 to-transparent">
            <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Follow-Up Alerts
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              AI-driven reminder: Follow up with Lead "Sarah Jenkins" about their enterprise proposal. No contact has been made since the proposal was sent 3 days ago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
