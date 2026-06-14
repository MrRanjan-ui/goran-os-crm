"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Forms";
import { Button } from "@/components/ui/button";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
  clients: any[];
  onSubmit: (data: any) => Promise<void>;
}

export function ProjectModal({ isOpen, onClose, project, clients, onSubmit }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    status: "Active",
    priority: "Medium",
    budget: "",
    startDate: "",
    endDate: "",
    billingType: "one-time",
    developmentCharge: "",
    recurringFee: "",
    recurringInterval: "monthly"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || "",
        clientId: project.clientId || "",
        status: project.status || "Active",
        priority: project.priority || "Medium",
        budget: project.budget ? String(project.budget) : "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        billingType: project.billingType || "one-time",
        developmentCharge: project.developmentCharge ? String(project.developmentCharge) : "",
        recurringFee: project.recurringFee ? String(project.recurringFee) : "",
        recurringInterval: project.recurringInterval || "monthly"
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        clientId: clients.length > 0 ? clients[0]._id : "",
        status: "Active",
        priority: "Medium",
        budget: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        billingType: "one-time",
        developmentCharge: "",
        recurringFee: "",
        recurringInterval: "monthly"
      });
    }
  }, [project, isOpen, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = {
        name: formData.name,
        clientId: formData.clientId,
        status: formData.status,
        priority: formData.priority,
        billingType: formData.billingType
      };
      if (formData.budget) payload.budget = Number(formData.budget);
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;
      if (formData.billingType === "one-time" || formData.billingType === "both") {
        if (formData.developmentCharge) payload.developmentCharge = Number(formData.developmentCharge);
      }
      if (formData.billingType === "recurring" || formData.billingType === "both") {
        if (formData.recurringFee) payload.recurringFee = Number(formData.recurringFee);
        if (formData.recurringInterval) payload.recurringInterval = formData.recurringInterval;
      }
      
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? "Edit Project" : "New Project"}
      description="Fill in the details for this project."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input 
            id="name" 
            required 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <Select 
            id="clientId" 
            required 
            value={formData.clientId}
            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
          >
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              id="status" 
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              id="priority" 
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="billingType">Billing Model</Label>
            <Select 
              id="billingType" 
              value={formData.billingType}
              onChange={e => setFormData({ ...formData, billingType: e.target.value })}
            >
              <option value="one-time">One-Time (Development Only)</option>
              <option value="recurring">Recurring Fee Only</option>
              <option value="both">Both (Dev Charge + Recurring)</option>
            </Select>
          </div>
          
          {(formData.billingType === "recurring" || formData.billingType === "both") && (
            <div className="space-y-2">
              <Label htmlFor="recurringInterval">Recurring Period</Label>
              <Select 
                id="recurringInterval" 
                value={formData.recurringInterval}
                onChange={e => setFormData({ ...formData, recurringInterval: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(formData.billingType === "one-time" || formData.billingType === "both") && (
            <div className="space-y-2">
              <Label htmlFor="developmentCharge">Development Charge ($)</Label>
              <Input 
                id="developmentCharge" 
                type="number" 
                min="0"
                placeholder="e.g. 5000"
                value={formData.developmentCharge} 
                onChange={e => setFormData({ ...formData, developmentCharge: e.target.value })} 
              />
            </div>
          )}

          {(formData.billingType === "recurring" || formData.billingType === "both") && (
            <div className="space-y-2">
              <Label htmlFor="recurringFee">Recurring Fee ($)</Label>
              <Input 
                id="recurringFee" 
                type="number" 
                min="0"
                placeholder="e.g. 350"
                value={formData.recurringFee} 
                onChange={e => setFormData({ ...formData, recurringFee: e.target.value })} 
              />
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-white/5 pt-4">
          <Label htmlFor="budget">Total Allocated Budget ($)</Label>
          <Input 
            id="budget" 
            type="number" 
            min="0"
            placeholder="e.g. 10000"
            value={formData.budget} 
            onChange={e => setFormData({ ...formData, budget: e.target.value })} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              type="date" 
              value={formData.startDate} 
              onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate" 
              type="date" 
              value={formData.endDate} 
              onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
