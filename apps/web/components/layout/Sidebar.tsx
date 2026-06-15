import Link from "next/link";
import {
  BarChart3,
  Users,
  Briefcase,
  Kanban,
  Wallet,
  UserRound,
  BookOpenCheck,
  Bot,
  MessageCircle,
  Bell,
  IndianRupee,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: IndianRupee },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/employees", label: "Employees", icon: UserRound },
  { href: "/knowledge", label: "Knowledge", icon: BookOpenCheck },
  { href: "/automations", label: "Automations", icon: Bot },
  { href: "/communications", label: "Comms AI", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell }
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        "glass flex h-screen flex-col gap-6 p-5",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
          GO
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold">GoRan OS</p>
            <p className="text-xs text-white/50">Agency Command</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              <Icon className="h-4 w-4 text-white/70" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60">
          AI Status: <span className="text-accent">Online</span>
        </div>
      )}
    </aside>
  );
}
