import { Router } from "express";
import { LeadModel } from "../models/Lead.js";
import { ClientModel } from "../models/Client.js";
import { ProjectModel } from "../models/Project.js";
import { InvoiceModel } from "../models/Invoice.js";
import { ExpenseModel } from "../models/Expense.js";
import { EmployeeModel } from "../models/Employee.js";
import { NotificationModel } from "../models/Notification.js";
import { MeetingModel } from "../models/Meeting.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const [
      totalLeads,
      activeClients,
      ongoingProjects,
      monthlyRevenue,
      monthlyExpenses,
      pendingInvoices,
      employeeCount,
      recentActivities,
      upcomingMeetings
    ] = await Promise.all([
      LeadModel.countDocuments({ isArchived: false }),
      ClientModel.countDocuments({ status: "Active", isArchived: false }),
      ProjectModel.countDocuments({ status: { $ne: "Completed" }, isArchived: false }),
      InvoiceModel.aggregate([
        { $match: { status: "Paid", isArchived: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      ExpenseModel.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      InvoiceModel.countDocuments({ status: "Overdue", isArchived: false }),
      EmployeeModel.countDocuments({ isArchived: false }),
      NotificationModel.find({ isArchived: false })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      MeetingModel.find({ isArchived: false })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      data: {
        totalLeads,
        activeClients,
        ongoingProjects,
        monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
        monthlyExpenses: monthlyExpenses[0]?.total ?? 0,
        pendingInvoices,
        employeeCount,
        recentActivities,
        upcomingMeetings
      }
    });
  } catch (err) {
    next(err);
  }
});
