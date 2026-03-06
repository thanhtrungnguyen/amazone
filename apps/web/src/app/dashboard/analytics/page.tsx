import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Eye,
  Star,
} from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";

export const metadata = {
  title: "Analytics -- Amazone Dashboard",
  description: "View your seller performance metrics and revenue analytics.",
};

// ---------- Placeholder data (cents) ----------

const stats = [
  {
    title: "Total Revenue",
    value: formatPrice(1_284_750),
    change: "+12.5% from last month",
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: "356",
    change: "+8.2% from last month",
    icon: ShoppingCart,
  },
  {
    title: "Avg Order Value",
    value: formatPrice(3_609),
    change: "+3.1% from last month",
    icon: BarChart3,
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "+0.4% from last month",
    icon: TrendingUp,
  },
];

const revenueByDay = [
  { date: "Feb 28", revenueInCents: 198_400 },
  { date: "Mar 01", revenueInCents: 165_200 },
  { date: "Mar 02", revenueInCents: 220_800 },
  { date: "Mar 03", revenueInCents: 142_500 },
  { date: "Mar 04", revenueInCents: 189_300 },
  { date: "Mar 05", revenueInCents: 251_600 },
  { date: "Mar 06", revenueInCents: 116_950 },
];

const topProducts = [
  {
    name: "Wireless Noise-Cancelling Headphones",
    unitsSold: 84,
    revenueInCents: 335_916,
  },
  {
    name: "USB-C Fast Charging Cable (3-Pack)",
    unitsSold: 213,
    revenueInCents: 254_787,
  },
  {
    name: "Ergonomic Mechanical Keyboard",
    unitsSold: 47,
    revenueInCents: 223_953,
  },
  {
    name: "Portable Bluetooth Speaker",
    unitsSold: 62,
    revenueInCents: 185_938,
  },
  {
    name: "Smart LED Desk Lamp",
    unitsSold: 91,
    revenueInCents: 136_409,
  },
];

interface ActivityEvent {
  id: string;
  type: "order" | "review" | "milestone";
  message: string;
  timestamp: string;
}

const recentActivity: ActivityEvent[] = [
  {
    id: "evt-1",
    type: "order",
    message: "New order #ord-047 from Sarah K. for $79.99",
    timestamp: "12 minutes ago",
  },
  {
    id: "evt-2",
    type: "review",
    message:
      'New 5-star review on "Wireless Noise-Cancelling Headphones"',
    timestamp: "1 hour ago",
  },
  {
    id: "evt-3",
    type: "milestone",
    message:
      '"USB-C Fast Charging Cable" reached 200 product views',
    timestamp: "3 hours ago",
  },
  {
    id: "evt-4",
    type: "order",
    message: "New order #ord-046 from Mike T. for $149.97",
    timestamp: "5 hours ago",
  },
  {
    id: "evt-5",
    type: "review",
    message:
      'New 4-star review on "Ergonomic Mechanical Keyboard"',
    timestamp: "8 hours ago",
  },
];

const activityIcons: Record<ActivityEvent["type"], typeof ShoppingCart> = {
  order: ShoppingCart,
  review: Star,
  milestone: Eye,
};

// ---------- Component ----------

export default function AnalyticsPage(): React.ReactElement {
  const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenueInCents));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your store performance and revenue trends
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByDay.map((day) => {
                const percentage =
                  maxRevenue > 0
                    ? Math.round((day.revenueInCents / maxRevenue) * 100)
                    : 0;

                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-sm text-muted-foreground">
                      {day.date}
                    </span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-primary/80 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                        {formatPrice(day.revenueInCents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="pr-6 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="max-w-[200px] truncate pl-6 font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.unitsSold}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium">
                      {formatPrice(product.revenueInCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest events from your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((event) => {
              const Icon = activityIcons[event.type];
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{event.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {event.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
