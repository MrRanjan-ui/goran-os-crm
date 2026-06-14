import { createCrudRouter } from "./resource.js";
import { TaskModel } from "../models/Task.js";
import { createTaskSchema, updateTaskSchema } from "../validation/index.js";

export const tasksRouter = createCrudRouter({
  model: TaskModel,
  resourceName: "task",
  createSchema: createTaskSchema,
  updateSchema: updateTaskSchema,
  searchFields: ["title", "description"]
});
