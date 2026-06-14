import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  badge,
  action
}: {
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {badge ? <Badge>{badge}</Badge> : null}
        </div>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
