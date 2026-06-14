import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Sparkles } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <Search className="h-4 w-4 text-white/60" />
        <input
          placeholder="Search leads, clients, projects..."
          className="w-64 bg-transparent text-sm text-white/80 outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <Badge>Realtime</Badge>
        <Button variant="ghost" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Ask AI
        </Button>
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
