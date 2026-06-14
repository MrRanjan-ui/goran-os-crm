import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/lib/store";

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-background/80 backdrop-blur-md">
          <Topbar />
        </header>
        <main className="flex-1 overflow-y-auto px-8 pt-4 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
