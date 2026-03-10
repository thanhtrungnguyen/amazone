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
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@amazone/shared-utils";
import { getAdminUsers } from "./actions";
import { UserActionsCell } from "./user-actions-cell";
import { UserFilters } from "./user-filters";
import { UserPagination } from "./user-pagination";

export const metadata = {
  title: "Users - Admin | Amazone",
  description: "Manage platform users, roles, and account statuses.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserRole = "admin" | "seller" | "customer";

const roleBadgeVariants: Record<
  UserRole,
  { label: string; className: string }
> = {
  admin: {
    label: "Admin",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  seller: {
    label: "Seller",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  customer: {
    label: "Customer",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

// ---------------------------------------------------------------------------
// Page props
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminUsersPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const search = params.search ?? "";
  const role = params.role ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { users, totalCount, totalPages, currentPage } = await getAdminUsers({
    search: search || undefined,
    role: role || undefined,
    page,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage platform users, roles, and account statuses.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <UserFilters />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {role && role !== "all"
              ? `${role.charAt(0).toUpperCase() + role.slice(1)}s`
              : "All Users"}
          </CardTitle>
          <CardDescription>
            {totalCount === 0
              ? "No users found."
              : `${totalCount} user${totalCount === 1 ? "" : "s"} found.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No users match your search criteria.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="w-[60px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const roleConfig = roleBadgeVariants[user.role];

                    return (
                      <TableRow key={user.id}>
                        {/* Avatar + Name + Email */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground"
                              aria-hidden="true"
                            >
                              {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={user.image}
                                  alt=""
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {user.name}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={roleConfig.className}
                          >
                            {roleConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {user.isBanned ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 border-red-200"
                            >
                              Banned
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200"
                            >
                              Active
                            </Badge>
                          )}
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="text-muted-foreground">
                          {user.joinedDate}
                        </TableCell>

                        {/* Orders */}
                        <TableCell className="text-right tabular-nums">
                          {user.orderCount}
                        </TableCell>

                        {/* Total Spent */}
                        <TableCell className="text-right tabular-nums">
                          {formatPrice(user.totalSpentCents)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <UserActionsCell user={user} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <UserPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
