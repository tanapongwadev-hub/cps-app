/**
 * Dashboard types
 */
export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  format: "number" | "currency" | "percent";
  icon?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
}

export interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface RecentActivity {
  id: string;
  type: "user" | "ticket" | "role" | "system" | "login";
  title: string;
  description: string;
  user: string;
  userAvatar?: string;
  timestamp: string;
  status: "success" | "warning" | "danger" | "info";
}

export interface DashboardData {
  kpis: DashboardKpi[];
  trendChart: ChartSeries[];
  statusChart: Array<{ name: string; value: number; color: string }>;
  categoryChart: Array<{ name: string; value: number; color: string }>;
  recentActivities: RecentActivity[];
  pendingTasks: RecentActivity[];
  systemStatus: {
    server: "online" | "offline" | "maintenance";
    database: "online" | "offline" | "maintenance";
    cache: "online" | "offline" | "maintenance";
    storage: { used: number; total: number; unit: string };
  };
}
