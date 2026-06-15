import { Router } from "express";
import { LeadModel } from "../models/Lead.js";
import { ClientModel } from "../models/Client.js";
import { ProjectModel } from "../models/Project.js";
import { InvoiceModel } from "../models/Invoice.js";
import { ExpenseModel } from "../models/Expense.js";
import { EmployeeModel } from "../models/Employee.js";
import { NotificationModel } from "../models/Notification.js";
import { MeetingModel } from "../models/Meeting.js";
import { env } from "../config/env.js";
import { fetchCalcomBookings } from "../services/calcom.js";

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
      (async () => {
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Fetch local meetings scheduled within the next 7 days
        const localMeetings = await MeetingModel.find({
          isArchived: false,
          scheduledAt: { $gte: now, $lte: sevenDaysLater }
        }).lean();

        const mappedLocal = localMeetings.map((meet: any) => ({
          id: String(meet._id),
          title: meet.title,
          scheduledAt: meet.scheduledAt.toISOString(),
          meetingLink: meet.meetingLink || null,
          type: "meeting"
        }));

        // Fetch Cal.com events
        let calcomEvents: any[] = [];
        if (env.CALCOM_API_KEY) {
          try {
            const bookingsList = await fetchCalcomBookings();
            calcomEvents = bookingsList.map((booking: any) => {
              const startStr = booking.start || booking.startTime;
              const startD = new Date(startStr);
              const attendee = booking.attendees?.[0];
              return {
                id: String(booking.id),
                title: booking.title || `Cal.com meeting with ${attendee?.name || "Client"}`,
                scheduledAt: startD.toISOString(),
                meetingLink: booking.meetingUrl || booking.location || null,
                type: "calcom"
              };
            });
          } catch (err) {
            console.error("Dashboard failed to fetch live Cal.com bookings:", err);
          }
        } else {
          // Fallback mock Cal.com events within next 7 days for demo
          const formatOffsetDate = (days: number, hours: number) => {
            const d = new Date(now);
            d.setDate(now.getDate() + days);
            d.setHours(hours, 0, 0, 0);
            return d.toISOString();
          };
          calcomEvents = [
            {
              id: "mock_cal_1",
              title: "[Cal.com] AI Automation Discovery Session",
              scheduledAt: formatOffsetDate(1, 14), // Tomorrow 2:00 PM
              meetingLink: "https://cal.com/video/mock-nova-session",
              type: "calcom"
            },
            {
              id: "mock_cal_2",
              title: "[Cal.com] Retainer Monthly Sync",
              scheduledAt: formatOffsetDate(3, 10), // 3 days from now, 10:00 AM
              meetingLink: "https://meet.google.com/xyz-mock-meet",
              type: "calcom"
            }
          ];
        }

        const filteredCalcom = calcomEvents.filter(e => {
          const d = new Date(e.scheduledAt);
          return d >= now && d <= sevenDaysLater;
        });

        return [...mappedLocal, ...filteredCalcom].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
      })()
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
