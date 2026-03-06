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

export const metadata = {
  title: "Users - Admin | Amazone",
  description: "Manage platform users, roles, and account statuses.",
};

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

type UserRole = "admin" | "seller" | "customer";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedDate: string;
  orderCount: number;
}

const placeholderUsers: AdminUser[] = [
  {
    id: "usr-001",
    name: "Thanh Tran",
    email: "thanh@amazone.com",
    role: "admin",
    joinedDate: "2025-01-15",
    orderCount: 0,
  },
  {
    id: "usr-002",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    role: "seller",
    joinedDate: "2025-03-22",
    orderCount: 5,
  },
  {
    id: "usr-003",
    name: "Bob Smith",
    email: "bob.smith@example.com",
    role: "customer",
    joinedDate: "2025-06-10",
    orderCount: 12,
  },
  {
    id: "usr-004",
    name: "Charlie Nguyen",
    email: "charlie.n@example.com",
    role: "seller",
    joinedDate: "2025-08-05",
    orderCount: 3,
  },
  {
    id: "usr-005",
    name: "Diana Lee",
    email: "diana.lee@example.com",
    role: "customer",
    joinedDate: "2025-11-18",
    orderCount: 8,
  },
  {
    id: "usr-006",
    name: "Ethan Park",
    email: "ethan.p@example.com",
    role: "customer",
    joinedDate: "2026-01-03",
    orderCount: 1,
  },
];

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getUsers(): Promise<AdminUser[]> {
  try {
    const { db, users, orders } = await import("@amazone/db");
    const { sql, desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        joinedDate: users.createdAt,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      joinedDate: row.joinedDate.toISOString().slice(0, 10),
      orderCount: row.orderCount,
    }));
  } catch {
    return placeholderUsers;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleBadgeVariant(
  role: UserRole
): "default" | "secondary" | "outline" {
  switch (role) {
    case "admin":
      return "default";
    case "seller":
      return "secondary";
    case "customer":
      return "outline";
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminUsersPage(): Promise<React.ReactElement> {
  const users = await getUsers();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage platform users, roles, and account statuses.
        </p>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} users registered on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.joinedDate}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.orderCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
