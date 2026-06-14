import { createCrudRouter } from "./resource.js";
import { DocumentModel } from "../models/Document.js";
import { createDocumentSchema, updateDocumentSchema } from "../validation/index.js";

export const documentsRouter = createCrudRouter({
  model: DocumentModel,
  resourceName: "document",
  createSchema: createDocumentSchema,
  updateSchema: updateDocumentSchema,
  searchFields: ["title", "type"]
});
