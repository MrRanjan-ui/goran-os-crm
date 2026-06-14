import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { UserModel } from "./models/User.js";
import { ClientModel } from "./models/Client.js";
import { ProjectModel } from "./models/Project.js";
import { AutomationModel } from "./models/Automation.js";
import { AiLogModel } from "./models/AiLog.js";
import { LeadModel } from "./models/Lead.js";
import { EmployeeModel } from "./models/Employee.js";
import { ExpenseModel } from "./models/Expense.js";
import { InvoiceModel } from "./models/Invoice.js";
import { MeetingModel } from "./models/Meeting.js";
import { NotificationModel } from "./models/Notification.js";

async function seed() {
  console.log("Connecting to database...");
  await connectDatabase();
  console.log("Connected successfully!");

  // 1. Get or create a user for clerkUserId reference
  let user = await UserModel.findOne();
  if (!user) {
    console.log("No user found. Creating a default user...");
    user = await UserModel.create({
      clerkUserId: "user_seed_placeholder_12345",
      email: "admin@goran-os.com",
      name: "Default Admin",
      role: "owner"
    });
  }
  const creatorId = user.clerkUserId;
  console.log(`Using clerkUserId "${creatorId}" as creator/updater.`);

  // 2. Clear existing collections to start fresh
  console.log("Clearing existing data...");
  await Promise.all([
    ClientModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    AutomationModel.deleteMany({}),
    AiLogModel.deleteMany({}),
    LeadModel.deleteMany({}),
    EmployeeModel.deleteMany({}),
    ExpenseModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    MeetingModel.deleteMany({}),
    NotificationModel.deleteMany({})
  ]);
  console.log("Existing data cleared.");

  // 3. Create 5 Clients
  console.log("Seeding clients...");
  const clientsData = [
    { name: "Acme Corp", primaryContact: "John Smith", email: "john@acme.com", industry: "Technology", status: "Active", website: "https://acme.com", address: "123 Coyote Way, Desert Valley", notes: "Long-term client with multiple active integrations." },
    { name: "Stark Industries", primaryContact: "Tony Stark", email: "tony@stark.com", industry: "Aerospace", status: "Active", website: "https://stark.com", address: "10880 Malibu Point, Malibu, CA", notes: "Demanding client; requests frequent AI optimizations." },
    { name: "Wayne Enterprises", primaryContact: "Bruce Wayne", email: "bruce@wayne.com", industry: "Defense", status: "Active", website: "https://wayne.com", address: "1007 Mountain Drive, Gotham City", notes: "Strict NDA; mostly off-site communication." },
    { name: "Globex Corporation", primaryContact: "Hank Scorpio", email: "hank@globex.com", industry: "Energy", status: "Active", website: "https://globex.com", address: "Cypress Creek, OR", notes: "High value recurring contract." },
    { name: "Initech", primaryContact: "Peter Gibbons", email: "peter@initech.com", industry: "Software", status: "Churned", website: "https://initech.com", address: "4120 Freemont Ave, Austin, TX", notes: "Contract terminated post Y2K Bug completion." }
  ];

  const clients = await ClientModel.create(
    clientsData.map(c => ({
      ...c,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${clients.length} clients.`);

  const clientMap = new Map(clients.map(c => [c.name, c._id.toString()]));

  // 4. Create 7 Projects
  console.log("Seeding projects...");
  const projectsData = [
    { 
      name: "AI CRM Integration", 
      clientName: "Acme Corp", 
      status: "Active", 
      priority: "High", 
      budget: 120000, 
      startDate: new Date("2026-04-01"), 
      endDate: new Date("2026-08-01"),
      scopeOfWork: ["Database schema design", "Express API endpoints setup", "Clerk Authentication integration", "Dashboard UI mockups", "Zod validation setup"],
      billingType: "both",
      developmentCharge: 80000,
      recurringFee: 10000,
      recurringInterval: "monthly"
    },
    { 
      name: "Arc Reactor Optimization", 
      clientName: "Stark Industries", 
      status: "Active", 
      priority: "Urgent", 
      budget: 450000, 
      startDate: new Date("2026-03-15"), 
      endDate: new Date("2026-12-31"),
      scopeOfWork: ["Core reactor thermal audit", "Palladium alternative analysis", "UI status telemetry panel", "Safety failsafe overrides"],
      billingType: "both",
      developmentCharge: 300000,
      recurringFee: 25000,
      recurringInterval: "monthly"
    },
    { 
      name: "Batcave Network Security", 
      clientName: "Wayne Enterprises", 
      status: "Paused", 
      priority: "High", 
      budget: 85000, 
      startDate: new Date("2026-06-01"), 
      endDate: new Date("2026-09-01"),
      scopeOfWork: ["Intruder alert system patch", "Encrypted satellite relay security", "Biometric gate lock firewall"],
      billingType: "one-time",
      developmentCharge: 85000
    },
    { 
      name: "Weather Control System", 
      clientName: "Globex Corporation", 
      status: "Active", 
      priority: "Urgent", 
      budget: 1200000, 
      startDate: new Date("2026-01-10"), 
      endDate: new Date("2027-01-10"),
      scopeOfWork: ["Atmospheric beam modeling", "Cloud-seeding drone firmware", "Central control station dashboard"],
      billingType: "both",
      developmentCharge: 600000,
      recurringFee: 50000,
      recurringInterval: "monthly"
    },
    { 
      name: "Y2K Bug Audit", 
      clientName: "Initech", 
      status: "Completed", 
      priority: "Low", 
      budget: 15000, 
      startDate: new Date("2026-02-01"), 
      endDate: new Date("2026-03-31"),
      scopeOfWork: ["COBOL code scanner script", "Database date column migrations", "Client compliance reports verification"],
      billingType: "one-time",
      developmentCharge: 15000
    },
    { 
      name: "Acme Analytics Pipeline", 
      clientName: "Acme Corp", 
      status: "Active", 
      priority: "Medium", 
      budget: 60000, 
      startDate: new Date("2026-05-01"), 
      endDate: new Date("2026-07-31"),
      scopeOfWork: ["Data ingestion pipeline", "Real-time dashboard visuals", "Excel monthly export reports"],
      billingType: "recurring",
      recurringFee: 5000,
      recurringInterval: "monthly"
    },
    { 
      name: "Wayne Satellite Communications", 
      clientName: "Wayne Enterprises", 
      status: "Active", 
      priority: "Medium", 
      budget: 250000, 
      startDate: new Date("2026-04-15"), 
      endDate: new Date("2026-10-15"),
      scopeOfWork: ["Low-Earth orbit relay configs", "Telemetry signals decoder", "High-frequency security shields"],
      billingType: "both",
      developmentCharge: 150000,
      recurringFee: 15000,
      recurringInterval: "monthly"
    }
  ];

  const projects = await ProjectModel.create(
    projectsData.map(p => ({
      name: p.name,
      clientId: clientMap.get(p.clientName),
      status: p.status,
      priority: p.priority,
      budget: p.budget,
      startDate: p.startDate,
      endDate: p.endDate,
      scopeOfWork: p.scopeOfWork,
      billingType: p.billingType || "one-time",
      developmentCharge: p.developmentCharge,
      recurringFee: p.recurringFee,
      recurringInterval: p.recurringInterval,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${projects.length} projects.`);

  const projectMap = new Map(projects.map(p => [p.name, p._id.toString()]));

  // 5. Create 5 Automations
  console.log("Seeding automations...");
  const automationsData = [
    { name: "Lead Generation Webhook", trigger: "new_lead", webhookUrl: "https://n8n.example.com/webhook/lead", enabled: true },
    { name: "Invoice Paid Sync", trigger: "invoice_paid", webhookUrl: "https://n8n.example.com/webhook/invoice", enabled: true },
    { name: "Project Status Alert", trigger: "project_updated", webhookUrl: "https://n8n.example.com/webhook/project", enabled: false },
    { name: "Meeting Summarizer", trigger: "meeting_ended", webhookUrl: "https://n8n.example.com/webhook/meeting", enabled: true },
    { name: "Client Sentiment Monitor", trigger: "client_email", webhookUrl: "https://n8n.example.com/webhook/sentiment", enabled: true }
  ];

  const automations = await AutomationModel.create(
    automationsData.map(a => ({
      ...a,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${automations.length} automations.`);

  // 6. Create 5 AI Logs / Audits
  console.log("Seeding AI logs...");
  const aiLogsData = [
    { category: "Lead Enrichment", model: "gemini-1.5-pro", prompt: "Summarize company profile for Acme Corp", response: "Acme Corp is a leading provider of innovative roadrunner-catching solutions..." },
    { category: "Sentiment Analysis", model: "gemini-1.5-flash", prompt: "Analyze tone of Stark Industries latest email", response: "Tone is highly assertive and direct, indicating urgent priority." },
    { category: "Automated Responders", model: "gemini-1.5-flash", prompt: "Draft follow-up email for Wayne Enterprises", response: "Dear Bruce, following up on our batcave security proposal..." },
    { category: "Financial Analytics", model: "gemini-1.5-pro", prompt: "Estimate profit margin for Weather Control project", response: "Estimated profit margin is 35% based on current milestone deliverables." },
    { category: "Meeting Summarizer", model: "gemini-1.5-flash", prompt: "Summarize Initech Y2K audit meeting", response: "Meeting focused on shifting resources to resolve critical legacy date formats." }
  ];

  const aiLogs = await AiLogModel.create(
    aiLogsData.map(l => ({
      ...l,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${aiLogs.length} AI logs.`);

  // 7. Create 5 Leads
  console.log("Seeding leads...");
  const leadsData = [
    { companyName: "Umbrella Corp", contactName: "Albert Wesker", email: "albert@umbrella.com", estimatedValue: 500000, stage: "Negotiation", aiScore: 88, aiProbability: 0.85 },
    { companyName: "Cyberdyne Systems", contactName: "Miles Dyson", email: "miles@cyberdyne.com", estimatedValue: 750000, stage: "Proposal Sent", aiScore: 92, aiProbability: 0.90 },
    { companyName: "Tyrell Corporation", contactName: "Eldon Tyrell", email: "eldon@tyrell.com", estimatedValue: 1200000, stage: "Contacted", aiScore: 78, aiProbability: 0.70 },
    { companyName: "Buy n Large", contactName: "Shelby Forthright", email: "shelby@bnl.com", estimatedValue: 3000000, stage: "New", aiScore: 95, aiProbability: 0.95 },
    { companyName: "Hooli", contactName: "Gavin Belson", email: "gavin@hooli.xyz", estimatedValue: 400000, stage: "Discovery Call", aiScore: 84, aiProbability: 0.80 }
  ];

  const leads = await LeadModel.create(
    leadsData.map(l => ({
      ...l,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${leads.length} leads.`);

  // 8. Create 5 Employees
  console.log("Seeding employees...");
  const employeesData = [
    { name: "Alice Vance", role: "AI Automation Architect", email: "alice@goran-os.com", status: "Active", allocation: 80 },
    { name: "Bob Miller", role: "Full Stack Developer", email: "bob@goran-os.com", status: "Active", allocation: 100 },
    { name: "Charlie Green", role: "Product Manager", email: "charlie@goran-os.com", status: "Active", allocation: 50 },
    { name: "Diana Prince", role: "Solutions Engineer", email: "diana@goran-os.com", status: "Active", allocation: 90 },
    { name: "Evan Wright", role: "Security Auditor", email: "evan@goran-os.com", status: "Active", allocation: 30 }
  ];

  const employees = await EmployeeModel.create(
    employeesData.map(e => ({
      ...e,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${employees.length} employees.`);

  // 9. Create 5 Expenses
  console.log("Seeding expenses...");
  const expensesData = [
    { vendor: "Google Cloud", amount: 1250.50, category: "Infrastructure", incurredOn: new Date("2026-05-01") },
    { vendor: "OpenAI API", amount: 480.20, category: "AI Services", incurredOn: new Date("2026-05-05") },
    { vendor: "Clerk Auth", amount: 150.00, category: "SaaS", incurredOn: new Date("2026-05-10") },
    { vendor: "Cloudinary", amount: 89.00, category: "Storage", incurredOn: new Date("2026-05-12") },
    { vendor: "Github Enterprise", amount: 350.00, category: "Developer Tools", incurredOn: new Date("2026-05-15") }
  ];

  const expenses = await ExpenseModel.create(
    expensesData.map(e => ({
      ...e,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${expenses.length} expenses.`);

  // 10. Create 5 Invoices
  console.log("Seeding invoices...");
  const invoicesData = [
    { clientName: "Acme Corp", projectName: "AI CRM Integration", amount: 40000, status: "Paid", paidOn: new Date("2026-05-10"), billingType: "one-time", paymentCategory: "development_charge" },
    { clientName: "Stark Industries", projectName: "Arc Reactor Optimization", amount: 150000, status: "Paid", paidOn: new Date("2026-05-12"), billingType: "one-time", paymentCategory: "development_charge" },
    { clientName: "Wayne Enterprises", projectName: "Batcave Network Security", amount: 30000, status: "Overdue", dueDate: new Date("2026-05-01"), billingType: "one-time", paymentCategory: "development_charge" },
    { clientName: "Globex Corporation", projectName: "Weather Control System", amount: 400000, status: "Sent", dueDate: new Date("2026-06-01"), billingType: "one-time", paymentCategory: "development_charge" },
    { clientName: "Acme Corp", projectName: "Acme Analytics Pipeline", amount: 20000, status: "Draft", billingType: "recurring", paymentCategory: "recurring_fee", billingPeriod: "June 2026", recurringInterval: "monthly" }
  ];

  const invoices = await InvoiceModel.create(
    invoicesData.map(i => ({
      clientId: clientMap.get(i.clientName),
      projectId: projectMap.get(i.projectName),
      amount: i.amount,
      status: i.status,
      paidOn: i.paidOn,
      dueDate: i.dueDate,
      billingType: i.billingType,
      paymentCategory: i.paymentCategory,
      recurringInterval: i.recurringInterval,
      billingPeriod: i.billingPeriod,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${invoices.length} invoices.`);

  // 11. Create 5 Meetings
  console.log("Seeding meetings...");
  const meetingsData = [
    { title: "Project Kickoff", clientName: "Acme Corp", scheduledAt: new Date("2026-05-21T10:00:00Z"), notes: "Review timeline and deliverables." },
    { title: "Weekly Sync", clientName: "Stark Industries", scheduledAt: new Date("2026-05-22T14:30:00Z"), notes: "Check milestone 2 progress." },
    { title: "Security Review", clientName: "Wayne Enterprises", scheduledAt: new Date("2026-05-23T09:00:00Z"), notes: "Discuss penetration testing results." },
    { title: "Budget Alignment", clientName: "Globex Corporation", scheduledAt: new Date("2026-05-24T16:00:00Z"), notes: "Finalize Phase 2 resource plan." },
    { title: "Audit Wrap-up", clientName: "Initech", scheduledAt: new Date("2026-05-25T11:00:00Z"), notes: "Confirm Y2K test suite results." }
  ];

  const meetings = await MeetingModel.create(
    meetingsData.map(m => ({
      title: m.title,
      clientId: clientMap.get(m.clientName),
      scheduledAt: m.scheduledAt,
      notes: m.notes,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${meetings.length} meetings.`);

  // 12. Create 5 Notifications
  console.log("Seeding notifications...");
  const notificationsData = [
    { title: "New Lead Created", message: "Umbrella Corp has been added as a lead.", type: "info" },
    { title: "Invoice Overdue", message: "Wayne Enterprises invoice #3 is 19 days overdue.", type: "warning" },
    { title: "Project Milestones", message: "Stark Industries Arc Reactor Optimization is 75% complete.", type: "success" },
    { title: "Webhook Triggered", message: "Lead Generation Webhook fired successfully.", type: "info" },
    { title: "High Sentiment Risk", message: "Acme Corp sentiment has dropped slightly.", type: "error" }
  ];

  const notifications = await NotificationModel.create(
    notificationsData.map(n => ({
      ...n,
      createdBy: creatorId,
      updatedBy: creatorId
    }))
  );
  console.log(`Seeded ${notifications.length} notifications.`);

  console.log("Database seeded successfully!");
  mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  mongoose.disconnect();
});
