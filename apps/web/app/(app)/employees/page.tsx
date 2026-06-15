"use client";

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
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";

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
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formAllocation, setFormAllocation] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<EmployeesResponse>("/employees", token);
    }
  });

  const employees = data?.data ?? [];

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const token = await getToken();
      return apiPost("/employees", employeeData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      return apiPatch(`/employees/${id}`, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiDelete(`/employees/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });

  // Helpers
  const resetForm = () => {
    setFormName("");
    setFormRole("");
    setFormEmail("");
    setFormStatus("Active");
    setFormAllocation("0");
    setEditingEmployee(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormEmail(emp.email);
    setFormStatus(emp.status);
    setFormAllocation(String(emp.allocation ?? 0));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
        alert("Failed to delete employee.");
      }
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: formName.trim(),
        role: formRole.trim(),
        email: formEmail.trim(),
        status: formStatus,
        allocation: Number(formAllocation)
      };

      if (!payload.name || !payload.role || !payload.email) {
        alert("Please fill in all required fields.");
        setIsSaving(false);
        return;
      }

      if (editingEmployee) {
        await updateEmployeeMutation.mutateAsync({ id: editingEmployee._id, data: payload });
      } else {
        await createEmployeeMutation.mutateAsync(payload);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save employee.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Team capacity, workload, and AI productivity insights."
        badge="Workload"
        action={
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" /> New Employee
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
          <p className="text-sm text-white/50 text-center py-6">No employees found. Click "New Employee" to get started.</p>
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
                <Card className="hover:scale-[1.01] transition-transform duration-200 flex flex-col justify-between h-full group relative">
                  <div>
                    <div className="flex items-start justify-between mb-4 gap-4">
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
                      
                      <div className="flex items-center gap-2">
                        {/* Hover Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="text-white/40 hover:text-accent p-1 rounded hover:bg-white/5 transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="text-white/40 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        <Badge className={`border ${getStatusBadge(emp.status)}`}>
                          {emp.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5 text-sm">
                      <div className="flex items-center justify-between text-white/60">
                        <span className="text-xs text-white/40">Email:</span>
                        <a href={`mailto:${emp.email}`} className="hover:underline hover:text-accent transition-colors text-xs font-mono">
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

      {/* CRUD Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? "Edit Staff Member" : "Add Staff Member"}
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="empName">Full Name *</Label>
            <Input
              id="empName"
              required
              placeholder="e.g. Sarah Jenkins"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empRole">Role / Job Title *</Label>
            <Input
              id="empRole"
              required
              placeholder="e.g. Senior Frontend Engineer"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empEmail">Email Address *</Label>
            <Input
              id="empEmail"
              type="email"
              required
              placeholder="e.g. sarah@agency.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="empStatus">Status</Label>
              <Select
                id="empStatus"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empAllocation">Workload Allocation (%)</Label>
              <Input
                id="empAllocation"
                type="number"
                min="0"
                max="100"
                required
                value={formAllocation}
                onChange={(e) => setFormAllocation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Member"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
