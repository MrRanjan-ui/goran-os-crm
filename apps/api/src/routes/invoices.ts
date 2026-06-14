import { createCrudRouter } from "./resource.js";
import { InvoiceModel } from "../models/Invoice.js";
import { createInvoiceSchema, updateInvoiceSchema } from "../validation/index.js";

export const invoicesRouter = createCrudRouter({
  model: InvoiceModel,
  resourceName: "invoice",
  createSchema: createInvoiceSchema,
  updateSchema: updateInvoiceSchema,
  searchFields: ["status"]
});
