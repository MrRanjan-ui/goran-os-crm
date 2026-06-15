import { ProjectModel } from "../models/Project.js";
import { InvoiceModel } from "../models/Invoice.js";

function getBillingPeriodLabel(dateInput: Date | string): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Ensures that an invoice exists for the project's current recurringPaymentDate.
 * Also keeps the payment status in sync.
 */
export async function syncProjectInvoice(project: any, userId: string): Promise<void> {
  if (
    (project.billingType === "recurring" || project.billingType === "both") &&
    project.recurringFee &&
    project.recurringPaymentDate
  ) {
    const paymentDate = new Date(project.recurringPaymentDate);
    paymentDate.setUTCHours(0, 0, 0, 0);

    const existing = await InvoiceModel.findOne({
      projectId: String(project._id),
      dueDate: paymentDate,
      isArchived: false
    });

    if (!existing) {
      console.log(`[Recurring Sync] Creating initial invoice for project ${project.name} on date ${paymentDate.toISOString()}`);
      await InvoiceModel.create({
        clientId: project.clientId,
        projectId: String(project._id),
        amount: project.recurringFee,
        status: project.recurringPaymentStatus === "Paid" ? "Paid" : "Due",
        dueDate: paymentDate,
        billingType: "recurring",
        paymentCategory: "recurring_fee",
        billingPeriod: getBillingPeriodLabel(paymentDate),
        createdBy: userId,
        updatedBy: userId
      });
      
      // If we just created the invoice as Paid, trigger the next cycle automatically
      if (project.recurringPaymentStatus === "Paid") {
        await advanceProjectCycle(project, paymentDate, userId);
      }
    } else {
      // Keep existing invoice status in sync if project was updated to Paid
      if (project.recurringPaymentStatus === "Paid" && existing.status !== "Paid") {
        console.log(`[Recurring Sync] Project marked Paid. Updating invoice status to Paid.`);
        existing.status = "Paid";
        await existing.save();
        await advanceProjectCycle(project, paymentDate, userId);
      }
    }
  }
}

/**
 * Handles invoice status updates. If a recurring invoice is marked Paid,
 * it advances the project to the next month and creates the next pending invoice.
 */
export async function handleInvoicePayment(invoice: any, userId: string): Promise<void> {
  if (
    invoice.billingType === "recurring" &&
    invoice.paymentCategory === "recurring_fee" &&
    invoice.status === "Paid" &&
    invoice.projectId
  ) {
    const project = await ProjectModel.findById(invoice.projectId);
    if (project) {
      const currentDueDate = new Date(invoice.dueDate);
      currentDueDate.setUTCHours(0, 0, 0, 0);

      const projectPaymentDate = new Date(project.recurringPaymentDate);
      projectPaymentDate.setUTCHours(0, 0, 0, 0);

      // Verify that the project is still pointing to this payment cycle
      if (projectPaymentDate.getTime() === currentDueDate.getTime()) {
        await advanceProjectCycle(project, currentDueDate, userId);
      }
    }
  }
}

/**
 * Internal helper to advance the project cycle and schedule the next monthly invoice.
 */
async function advanceProjectCycle(project: any, currentDueDate: Date, userId: string): Promise<void> {
  const nextDueDate = new Date(currentDueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  nextDueDate.setUTCHours(0, 0, 0, 0);

  console.log(`[Recurring Sync] Advancing project ${project.name} cycle. Current: ${currentDueDate.toISOString()}, Next: ${nextDueDate.toISOString()}`);

  // Update Project
  await ProjectModel.findByIdAndUpdate(project._id, {
    recurringPaymentDate: nextDueDate,
    recurringPaymentStatus: "Pending" // reset status for next month
  });

  // Automatically create next monthly invoice as "Due"
  const nextInvoiceExisting = await InvoiceModel.findOne({
    projectId: String(project._id),
    dueDate: nextDueDate,
    isArchived: false
  });

  if (!nextInvoiceExisting) {
    console.log(`[Recurring Sync] Creating next cycle invoice for project ${project.name} on date ${nextDueDate.toISOString()}`);
    await InvoiceModel.create({
      clientId: project.clientId,
      projectId: String(project._id),
      amount: project.recurringFee,
      status: "Due",
      dueDate: nextDueDate,
      billingType: "recurring",
      paymentCategory: "recurring_fee",
      billingPeriod: getBillingPeriodLabel(nextDueDate),
      createdBy: userId,
      updatedBy: userId
    });
  }
}
