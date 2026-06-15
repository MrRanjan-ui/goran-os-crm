import { z } from "zod";

export const LeadStage = z.enum([
  "New",
  "Contacted",
  "Discovery Call",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost"
]);
export type LeadStage = z.infer<typeof LeadStage>;

export const CurrencyCode = z.enum(["USD", "INR", "EUR", "GBP", "AUD", "CAD"]);
export type CurrencyCode = z.infer<typeof CurrencyCode>;

export const Priority = z.enum(["Low", "Medium", "High", "Urgent"]);
export type Priority = z.infer<typeof Priority>;

export const Status = z.enum(["Active", "Paused", "Completed", "Cancelled"]);
export type Status = z.infer<typeof Status>;

export const BaseEntity = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const LeadSchema = BaseEntity.extend({
  companyName: z.string(),
  contactName: z.string(),
  phone: z.string().optional(),
  email: z.string().email(),
  source: z.string().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  stage: LeadStage,
  notes: z.string().optional(),
  followUpDate: z.string().optional()
});
export type Lead = z.infer<typeof LeadSchema>;

export const ClientSchema = BaseEntity.extend({
  name: z.string(),
  primaryContact: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["Active", "Onboarding", "Churned"]).default("Active"),
  imageUrl: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});
export type Client = z.infer<typeof ClientSchema>;

export const ProjectSchema = BaseEntity.extend({
  name: z.string(),
  clientId: z.string(),
  status: Status,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  priority: Priority,
  scopeOfWork: z.array(z.string()).optional(),
  billingType: z.enum(["one-time", "recurring", "both"]).default("one-time"),
  developmentCharge: z.number().nonnegative().optional(),
  recurringFee: z.number().nonnegative().optional(),
  recurringInterval: z.enum(["monthly", "yearly"]).optional(),
  recurringPaymentDate: z.string().optional(),
  recurringPaymentStatus: z.enum(["Pending", "Paid"]).optional()
});
export type Project = z.infer<typeof ProjectSchema>;

export const TaskSchema = BaseEntity.extend({
  projectId: z.string(),
  title: z.string(),
  status: z.enum(["Todo", "In Progress", "Blocked", "Done"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional()
});
export type Task = z.infer<typeof TaskSchema>;

export const InvoiceSchema = BaseEntity.extend({
  clientId: z.string(),
  projectId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: CurrencyCode,
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]),
  dueDate: z.string().optional(),
  billingType: z.enum(["one-time", "recurring"]).default("one-time"),
  paymentCategory: z.enum(["development_charge", "recurring_fee", "other"]).default("development_charge"),
  recurringInterval: z.enum(["monthly", "yearly"]).optional(),
  billingPeriod: z.string().optional()
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const ExpenseSchema = BaseEntity.extend({
  vendor: z.string(),
  amount: z.number().nonnegative(),
  currency: CurrencyCode,
  category: z.string().optional(),
  incurredOn: z.string().optional(),
  description: z.string().optional()
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const EmployeeSchema = BaseEntity.extend({
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  status: z.enum(["Active", "On Leave", "Inactive"])
});
export type Employee = z.infer<typeof EmployeeSchema>;
