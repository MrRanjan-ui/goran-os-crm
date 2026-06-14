import { createCrudRouter } from "./resource.js";
import { ExpenseModel } from "../models/Expense.js";
import { createExpenseSchema, updateExpenseSchema } from "../validation/index.js";

export const expensesRouter = createCrudRouter({
  model: ExpenseModel,
  resourceName: "expense",
  createSchema: createExpenseSchema,
  updateSchema: updateExpenseSchema,
  searchFields: ["vendor", "category"]
});
