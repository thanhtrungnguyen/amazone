import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Package,
  CreditCard,
  Star,
  Users,
  Database,
  Layers,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Cart & Checkout",
    description: "Optimistic cart updates with Stripe-powered checkout flow",
    badge: "@amazone/cart",
  },
  {
    icon: Package,
    title: "Product Catalog",
    description:
      "Cursor-based pagination, fuzzy search, and category filtering",
    badge: "@amazone/products",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Stripe integration with webhook handling and order tracking",
    badge: "@amazone/checkout",
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    description: "Verified purchase reviews with star ratings",
    badge: "@amazone/reviews",
  },
  {
    icon: Users,
    title: "User Accounts",
    description: "NextAuth.js v5 with customer, seller, and admin roles",
    badge: "@amazone/users",
  },
  {
    icon: Database,
    title: "Database",
    description: "PostgreSQL with Drizzle ORM — type-safe queries and migrations",
    badge: "@amazone/db",
  },
  {
    icon: Layers,
    title: "Shared UI",
    description: "Reusable components: price display, rating stars, and more",
    badge: "@amazone/shared-ui",
  },
  {
    icon: Shield,
    title: "Type Safety",
    description: "Zod schemas, strict TypeScript, and Nx package boundaries",
    badge: "@amazone/shared-utils",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <Badge variant="secondary" className="text-sm">
          Nx Monorepo + Next.js 16 + React 19
        </Badge>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Amazone</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          A full-featured e-commerce platform built with modern web
          technologies. Package-based architecture with domain-driven design.
        </p>
        <div className="flex gap-3">
          <Button size="lg">Browse Products</Button>
          <Button size="lg" variant="outline">
            Seller Dashboard
          </Button>
        </div>
      </header>

      <Separator />

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          Domain Packages
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Badge variant="outline" className="font-mono text-xs">
                  {feature.badge}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tech Stack */}
      <section className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Next.js 16",
            "React 19",
            "TypeScript 5.9",
            "Tailwind CSS 4",
            "shadcn/ui",
            "Drizzle ORM",
            "PostgreSQL",
            "Stripe",
            "NextAuth.js v5",
            "Zustand",
            "Zod",
            "Nx 22",
            "Vitest",
            "pnpm",
          ].map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>
          Amazone — Built with Nx monorepo architecture.
          Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm nx dev web</code> to start developing.
        </p>
      </footer>
    </div>
  );
}
