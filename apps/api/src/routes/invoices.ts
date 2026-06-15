import { createCrudRouter } from "./resource.js";
import { InvoiceModel } from "../models/Invoice.js";
import { createInvoiceSchema, updateInvoiceSchema } from "../validation/index.js";
import { handleInvoicePayment } from "../services/recurringRevenue.js";

export const invoicesRouter = createCrudRouter({
  model: InvoiceModel,
  resourceName: "invoice",
  createSchema: createInvoiceSchema,
  updateSchema: updateInvoiceSchema,
  searchFields: ["status"],
  postUpdate: async (invoice, req) => {
    const userId = req.user?.id ?? "system";
    await handleInvoicePayment(invoice, userId);
  }
});
