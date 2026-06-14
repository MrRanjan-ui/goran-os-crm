"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

type Employee = {
  _id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  allocation?: number;
};

type EmployeesResponse = {
  data: Employee[];
};

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    "On Leave": "bg-amber-500/10 text-amber-400 border-amber-500/25",
    Inactive: "bg-white/5 text-white/40 border-white/10"
  };
  return styles[status] || "bg-white/5 text-white/70";
}

function getAvatarGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  const gradients = [
    "from-violet-500 to-purple-500",
    "from-sky-500 to-cyan-500",
    "from-rose-500 to-pink-500",
    "from-teal-500 to-emerald-500",
    "from-orange-500 to-amber-500"
  ];
  return gradients[code % gradients.length];
}

export default function EmployeesPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<EmployeesResponse>("/employees", token);
    }
  });

  const employees = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Team capacity, workload, and AI productivity insights."
        badge="Workload"
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
              <div className="h-2 bg-white/5 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load employees data. Please try again later.</p>
        </Card>
      ) : employees.length === 0 ? (
        <Card>
          <p className="text-sm text-white/50 text-center py-6">No employees found. Seed the database to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp, index) => {
            const initials = emp.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            const allocation = emp.allocation ?? 0;

            return (
              <motion.div
                key={emp._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:scale-[1.01] transition-transform duration-200 cursor-pointer flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarGradient(emp.name)} flex items-center justify-center font-bold text-white shadow-lg text-sm`}>
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-white font-medium group-hover:text-accent transition-colors duration-150">
                            {emp.name}
                          </h3>
                          <span className="text-xs text-white/50">{emp.role}</span>
                        </div>
                      </div>
                      <Badge className={`border ${getStatusBadge(emp.status)}`}>
                        {emp.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5 text-sm">
                      <div className="flex items-center justify-between text-white/60">
                        <span className="text-xs text-white/40">Email:</span>
                        <a href={`mailto:${emp.email}`} className="hover:underline hover:text-accent transition-colors text-xs">
                          {emp.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-white/40">Allocation</span>
                      <span className="text-white/80 font-medium">{allocation}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          allocation >= 90
                            ? "bg-rose-500"
                            : allocation >= 70
                            ? "bg-amber-500"
                            : "bg-accent"
                        }`}
                        style={{ width: `${allocation}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
