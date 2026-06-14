import { createCrudRouter } from "./resource.js";
import { MeetingModel } from "../models/Meeting.js";
import { createMeetingSchema, updateMeetingSchema } from "../validation/index.js";

export const meetingsRouter = createCrudRouter({
  model: MeetingModel,
  resourceName: "meeting",
  createSchema: createMeetingSchema,
  updateSchema: updateMeetingSchema,
  searchFields: ["title"]
});
