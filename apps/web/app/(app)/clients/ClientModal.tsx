"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Forms";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { apiPost } from "@/lib/api";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function ClientModal({ isOpen, onClose, client, onSubmit }: ClientModalProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    primaryContact: "",
    email: "",
    phone: "",
    industry: "",
    status: "Active",
    contractUrl: "",
    imageUrl: "",
    website: "",
    address: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || "",
        primaryContact: client.primaryContact || "",
        email: client.email || "",
        phone: client.phone || "",
        industry: client.industry || "",
        status: client.status || "Active",
        contractUrl: client.contractUrl || "",
        imageUrl: client.imageUrl || "",
        website: client.website || "",
        address: client.address || "",
        notes: client.notes || ""
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        primaryContact: "",
        email: "",
        phone: "",
        industry: "",
        status: "Active",
        contractUrl: "",
        imageUrl: "",
        website: "",
        address: "",
        notes: ""
      });
    }
  }, [client, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const token = await getToken();
          const response = await apiPost<{ data: { secure_url: string } }>("/uploads", {
            dataUrl,
            folder: "clients"
          }, token);
          setFormData(prev => ({ ...prev, imageUrl: response.data.secure_url }));
        } catch (err) {
          console.error("Upload error:", err);
          alert("Image upload failed. Please try again.");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = {
        name: formData.name,
        primaryContact: formData.primaryContact,
        email: formData.email,
        status: formData.status
      };
      if (formData.phone) payload.phone = formData.phone;
      if (formData.industry) payload.industry = formData.industry;
      if (formData.contractUrl) payload.contractUrl = formData.contractUrl;
      if (formData.imageUrl) payload.imageUrl = formData.imageUrl;
      if (formData.website) payload.website = formData.website;
      if (formData.address) payload.address = formData.address;
      if (formData.notes) payload.notes = formData.notes;

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
      title={client ? "Edit Client" : "New Client"}
      description="Fill in the details for this client profile."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client/Company Name</Label>
          <Input
            id="clientName"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientImage">Client Logo / Photo</Label>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-lg">
            {formData.imageUrl ? (
              <img
                src={formData.imageUrl}
                alt="Client Preview"
                className="h-12 w-12 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/50 text-xs">
                Logo
              </div>
            )}
            <input
              id="clientImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="text-xs text-white/60 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer focus:outline-none"
            />
            {uploading && <span className="text-xs text-accent animate-pulse">Uploading...</span>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryContact">Primary Contact Person</Label>
          <Input
            id="primaryContact"
            required
            placeholder="e.g. John Doe"
            value={formData.primaryContact}
            onChange={e => setFormData({ ...formData, primaryContact: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email Address</Label>
            <Input
              id="clientEmail"
              type="email"
              required
              placeholder="e.g. contact@client.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Phone Number</Label>
            <Input
              id="clientPhone"
              placeholder="e.g. +1234567890"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientIndustry">Industry</Label>
            <Input
              id="clientIndustry"
              placeholder="e.g. Technology"
              value={formData.industry}
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientStatus">Relationship Status</Label>
            <Select
              id="clientStatus"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Churned">Churned</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              placeholder="e.g. https://client.com"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              placeholder="e.g. New York, USA"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes / Relationship Details</Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-accent focus:outline-none transition-colors"
            placeholder="Key client details, history, or context..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractUrl">Contract URL</Label>
          <Input
            id="contractUrl"
            type="url"
            placeholder="e.g. https://google.com/contract.pdf"
            value={formData.contractUrl}
            onChange={e => setFormData({ ...formData, contractUrl: e.target.value })}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
