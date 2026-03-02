import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$0.00",
    description: "No sales yet",
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "0",
    description: "No orders yet",
    icon: ShoppingCart,
  },
  {
    title: "Products",
    value: "0",
    description: "No products listed",
    icon: Package,
  },
  {
    title: "Conversion",
    value: "0%",
    description: "Start selling to track",
    icon: TrendingUp,
  },
];

export const metadata = {
  title: "Seller Dashboard — Amazone",
};

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your seller dashboard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
