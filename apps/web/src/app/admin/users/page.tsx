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
type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedDate: string;
  status: UserStatus;
}

const users: AdminUser[] = [
  {
    id: "usr-001",
    name: "Thanh Tran",
    email: "thanh@amazone.com",
    role: "admin",
    joinedDate: "2025-01-15",
    status: "active",
  },
  {
    id: "usr-002",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    role: "seller",
    joinedDate: "2025-03-22",
    status: "active",
  },
  {
    id: "usr-003",
    name: "Bob Smith",
    email: "bob.smith@example.com",
    role: "customer",
    joinedDate: "2025-06-10",
    status: "active",
  },
  {
    id: "usr-004",
    name: "Charlie Nguyen",
    email: "charlie.n@example.com",
    role: "seller",
    joinedDate: "2025-08-05",
    status: "suspended",
  },
  {
    id: "usr-005",
    name: "Diana Lee",
    email: "diana.lee@example.com",
    role: "customer",
    joinedDate: "2025-11-18",
    status: "active",
  },
  {
    id: "usr-006",
    name: "Ethan Park",
    email: "ethan.p@example.com",
    role: "customer",
    joinedDate: "2026-01-03",
    status: "active",
  },
];

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

function getStatusClasses(status: UserStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "suspended":
      return "bg-red-100 text-red-800 border-red-200";
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminUsersPage(): React.ReactElement {
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
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusClasses(user.status)}`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
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
