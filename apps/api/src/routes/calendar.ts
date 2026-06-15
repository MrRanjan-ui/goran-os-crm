import { Router } from "express";
import { env } from "../config/env.js";
import { fetchCalcomBookings } from "../services/calcom.js";
import { MeetingModel } from "../models/Meeting.js";
import { ProjectModel } from "../models/Project.js";
import { InvoiceModel } from "../models/Invoice.js";
import { z } from "zod";

export const calendarRouter = Router();

const createEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start: z.string(), // ISO String
  end: z.string(),   // ISO String
  clientId: z.string().optional(),
  generateMeet: z.boolean().default(false)
});

// 1. Get Cal.com Config Status
calendarRouter.get("/config", async (_req, res) => {
  try {
    const isConfigured = !!env.CALCOM_EVENT_LINK;
    // Standard default link to show if no link is configured in .env
    const eventLink = env.CALCOM_EVENT_LINK || "https://cal.com/calcom/30min";

    res.json({
      isConfigured,
      eventLink
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch combined calendar events (Cal.com + local CRM meetings, projects, invoices)
calendarRouter.get("/events", async (_req, res) => {
  try {
    let calcomEvents: any[] = [];
    let isLiveCalcom = false;

    // Fetch real bookings if Cal.com API key is provided
    console.log("[Calendar] env.CALCOM_API_KEY present:", !!env.CALCOM_API_KEY);
    if (env.CALCOM_API_KEY) {
      console.log("[Calendar] Fetching bookings from Cal.com caching service...");
      try {
        const bookingsList = await fetchCalcomBookings();
        calcomEvents = bookingsList.map((booking: any) => {
          const attendee = booking.attendees?.[0];
          const meetingLink = booking.meetingUrl || booking.location || null;
          return {
            id: String(booking.id),
            title: booking.title || `Cal.com meeting with ${attendee?.name || "Client"}`,
            description: booking.description || `Attendee: ${attendee?.email || "N/A"}.`,
            start: booking.start || booking.startTime || new Date().toISOString(),
            end: booking.end || booking.endTime || new Date().toISOString(),
            location: booking.location || "Cal Video",
            meetingLink: meetingLink && meetingLink.startsWith("http") ? meetingLink : null,
            type: "google", // Keep type as 'google' for visual styling
            status: booking.status
          };
        });
        isLiveCalcom = true;
      } catch (err) {
        console.error("Failed to fetch live Cal.com v2 bookings:", err);
      }
    }

    // Fallback Mock Cal.com Events if not connected or failed
    if (!isLiveCalcom) {
      const today = new Date();
      const formatOffsetDate = (days: number, hours: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() + days);
        d.setHours(hours, 0, 0, 0);
        return d.toISOString();
      };

      calcomEvents = [
        {
          id: "mock_cal_1",
          title: "[Cal.com] AI Automation Discovery Session",
          description: "Cal.com Booking. Client: ashish@nova-labs.io. Discuss agentic CRM solutions.",
          start: formatOffsetDate(1, 14), // Tomorrow 2:00 PM
          end: formatOffsetDate(1, 15),
          location: "Cal Video",
          meetingLink: "https://cal.com/video/mock-nova-session",
          type: "google" // Synced external event style (green theme)
        },
        {
          id: "mock_cal_2",
          title: "[Cal.com] Retainer Monthly Sync",
          description: "Cal.com Booking. Client: john@acme.com. Progress updates and Q3 milestones review.",
          start: formatOffsetDate(3, 10), // 3 days from now, 10:00 AM
          end: formatOffsetDate(3, 11),
          location: "Google Meet",
          meetingLink: "https://meet.google.com/xyz-mock-meet",
          type: "google"
        },
        {
          id: "mock_cal_3",
          title: "[Cal.com] Completed Intro Call",
          description: "Cal.com Booking. Client: sarah@wayne-defense.com.",
          start: formatOffsetDate(-1, 11), // Yesterday, 11:00 AM
          end: formatOffsetDate(-1, 11.5),
          location: "Cal Video",
          meetingLink: "https://cal.com/video/mock-completed",
          type: "google"
        }
      ];
    }

    // Fetch CRM Meetings
    const localMeetings = await MeetingModel.find({ isArchived: false }).lean();
    const mappedMeetings = localMeetings.map((meet: any) => ({
      id: String(meet._id),
      title: meet.title,
      description: meet.notes || "",
      start: meet.scheduledAt.toISOString(),
      end: new Date(meet.scheduledAt.getTime() + 60 * 60 * 1000).toISOString(), // Assume 1 hour
      meetingLink: meet.meetingLink || null,
      clientId: meet.clientId,
      type: "meeting"
    }));

    // Fetch Project Deadlines
    const projects = await ProjectModel.find({ isArchived: false, endDate: { $exists: true } }).lean();
    const mappedProjects = projects.map((proj: any) => ({
      id: String(proj._id),
      title: `🏁 Deadline: ${proj.name}`,
      description: `Project deadline. Budget: $${(proj.budget ?? 0).toLocaleString()}.`,
      start: proj.endDate.toISOString(),
      end: proj.endDate.toISOString(),
      type: "project"
    }));

    // Fetch Invoice Due Dates
    const invoices = await InvoiceModel.find({ isArchived: false, status: { $ne: "Paid" }, dueDate: { $exists: true } }).lean();
    const mappedInvoices = invoices.map((inv: any) => ({
      id: String(inv._id),
      title: `💵 Invoice Due: $${inv.amount}`,
      description: `Pending collection status: ${inv.status}.`,
      start: inv.dueDate.toISOString(),
      end: inv.dueDate.toISOString(),
      type: "invoice"
    }));

    // Fetch Projects with Recurring Retainer Payments
    const recurringProjects = await ProjectModel.find({
      isArchived: false,
      billingType: { $in: ["recurring", "both"] },
      recurringPaymentDate: { $exists: true, $ne: null }
    }).lean();

    const mappedRecurringPayments = recurringProjects.map((proj: any) => {
      const isOverdue = new Date(proj.recurringPaymentDate) < new Date() && proj.recurringPaymentStatus !== "Paid";
      const statusLabel = proj.recurringPaymentStatus === "Paid" ? "Paid" : isOverdue ? "Overdue" : "Pending";
      const statusIcon = proj.recurringPaymentStatus === "Paid" ? "✅" : isOverdue ? "⚠️" : "⏳";
      const fee = proj.recurringFee ?? 0;

      return {
        id: `recurring_proj_${proj._id}`,
        title: `${statusIcon} [${statusLabel}] Retainer: ${proj.name}`,
        description: `Recurring retainer payment of $${fee.toLocaleString()} (${proj.recurringInterval || 'monthly'}). Status: ${proj.recurringPaymentStatus || 'Pending'}.`,
        start: new Date(proj.recurringPaymentDate).toISOString(),
        end: new Date(proj.recurringPaymentDate).toISOString(),
        type: "invoice",
        status: proj.recurringPaymentStatus || "Pending"
      };
    });

    // Merge everything
    const allEvents = [
      ...calcomEvents,
      ...mappedMeetings,
      ...mappedProjects,
      ...mappedInvoices,
      ...mappedRecurringPayments
    ];

    res.json({
      googleConnected: isLiveCalcom, // Keeps compatible schema flag names
      events: allEvents
    });
  } catch (err: any) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Create a local calendar event / meeting
calendarRouter.post("/events", async (req, res) => {
  try {
    const payload = createEventSchema.parse(req.body);
    
    let meetingLink: string | null = null;

    // Generate mock video link if requested
    if (payload.generateMeet) {
      meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // Save Local CRM Meeting to MongoDB
    const createdBy = req.user?.clerkUserId ?? "system";
    const meeting = await MeetingModel.create({
      title: payload.title,
      notes: payload.description,
      scheduledAt: new Date(payload.start),
      clientId: payload.clientId || undefined,
      meetingLink: meetingLink || undefined,
      createdBy,
      updatedBy: createdBy
    });

    res.status(201).json({
      success: true,
      googleSync: false,
      meeting
    });
  } catch (err: any) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: err.message });
  }
});
