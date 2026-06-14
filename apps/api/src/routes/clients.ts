import { createCrudRouter } from "./resource.js";
import { ClientModel } from "../models/Client.js";
import { createClientSchema, updateClientSchema } from "../validation/index.js";

export const clientsRouter = createCrudRouter({
  model: ClientModel,
  resourceName: "client",
  createSchema: createClientSchema,
  updateSchema: updateClientSchema,
  searchFields: ["name", "primaryContact", "email"]
});
