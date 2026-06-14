import { createCrudRouter } from "./resource.js";
import { EmployeeModel } from "../models/Employee.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validation/index.js";

export const employeesRouter = createCrudRouter({
  model: EmployeeModel,
  resourceName: "employee",
  createSchema: createEmployeeSchema,
  updateSchema: updateEmployeeSchema,
  searchFields: ["name", "email", "role"]
});
