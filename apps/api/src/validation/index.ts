import { z } from "zod";

// Inlined from @goran-os/shared to avoid tsx workspace resolution issues at dev time
const LeadStage = z.enum([
  "New",
  "Contacted",
  "Discovery Call",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost"
]);

export const createLeadSchema = z.object({
  companyName: z.string(),
  contactName: z.string(),
  phone: z.string().optional(),
  email: z.string().email(),
  source: z.string().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  stage: LeadStage,
  notes: z.string().optional(),
  conversationHistory: z.array(z.string()).optional(),
  followUpDate: z.string().optional()
});
export const updateLeadSchema = createLeadSchema.partial();

export const createClientSchema = z.object({
  name: z.string(),
  primaryContact: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  status: z.string().optional(),
  contractUrl: z.string().url().optional(),
  imageUrl: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});
export const updateClientSchema = createClientSchema.partial();

export const createProjectSchema = z.object({
  name: z.string(),
  clientId: z.string(),
  status: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  priority: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
  scopeOfWork: z.array(z.string()).optional(),
  billingType: z.enum(["one-time", "recurring", "both"]).optional(),
  developmentCharge: z.number().nonnegative().optional(),
  recurringFee: z.number().nonnegative().optional(),
  recurringInterval: z.enum(["monthly", "yearly"]).optional(),
  recurringPaymentDate: z.string().optional(),
  recurringPaymentStatus: z.enum(["Pending", "Paid"]).optional()
});
export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional()
});
export const updateTaskSchema = createTaskSchema.partial();

export const createInvoiceSchema = z.object({
  clientId: z.string(),
  projectId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  paidOn: z.string().optional(),
  billingType: z.enum(["one-time", "recurring"]).optional(),
  paymentCategory: z.enum(["development_charge", "recurring_fee", "other"]).optional(),
  recurringInterval: z.enum(["monthly", "yearly"]).optional(),
  billingPeriod: z.string().optional()
});
export const updateInvoiceSchema = createInvoiceSchema.partial();

export const createExpenseSchema = z.object({
  vendor: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().optional(),
  category: z.string().optional(),
  incurredOn: z.string().optional(),
  description: z.string().optional()
});
export const updateExpenseSchema = createExpenseSchema.partial();

export const createEmployeeSchema = z.object({
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  status: z.string().optional(),
  allocation: z.number().optional()
});
export const updateEmployeeSchema = createEmployeeSchema.partial();

export const createMeetingSchema = z.object({
  title: z.string(),
  clientId: z.string().optional(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  meetingLink: z.string().optional()
});
export const updateMeetingSchema = createMeetingSchema.partial();

export const createNotificationSchema = z.object({
  title: z.string(),
  message: z.string(),
  type: z.string().optional(),
  read: z.boolean().optional(),
  entityRef: z.string().optional()
});
export const updateNotificationSchema = createNotificationSchema.partial();

export const createAutomationSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  webhookUrl: z.string().url(),
  enabled: z.boolean().optional()
});
export const updateAutomationSchema = createAutomationSchema.partial();

export const createDocumentSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.string(),
  linkedTo: z.string().optional()
});
export const updateDocumentSchema = createDocumentSchema.partial();

export const provisionUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.string().optional()
});

export const createAiLogSchema = z.object({
  category: z.string(),
  prompt: z.string(),
  response: z.string(),
  model: z.string().default("gemini-1.5-pro")
});
export const updateAiLogSchema = createAiLogSchema.partial();

export const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      parts: z.array(
        z.object({
          text: z.string()
        })
      )
    })
  )
});
