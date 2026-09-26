import {
  BoxesIcon,
  DollarSignIcon,
  RotateCcwIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Sales and stock at a glance. Figures appear here once the reporting
          screens are connected.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Sales today" value="—" icon={ShoppingCartIcon} />
        <KpiCard title="Revenue today" value="—" icon={DollarSignIcon} />
        <KpiCard title="Returns today" value="—" icon={RotateCcwIcon} />
        <KpiCard title="Low stock items" value="—" icon={BoxesIcon} />
      </div>
    </div>
  );
}
