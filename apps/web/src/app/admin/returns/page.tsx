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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ReturnRequestRow,
  type ReturnRequestRowData,
} from "./return-request-row";

export const metadata = {
  title: "Return Requests - Admin | Amazone",
  description: "Review and manage customer return requests.",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

type FilterTab = "all" | ReturnStatus;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getReturnRequests(
  statusFilter: ReturnStatus | null
): Promise<ReturnRequestRowData[]> {
  try {
    const { db, returnRequests, users } = await import("@amazone/db");
    const { desc, eq } = await import("drizzle-orm");

    const query = db
      .select({
        id: returnRequests.id,
        orderId: returnRequests.orderId,
        reason: returnRequests.reason,
        status: returnRequests.status,
        adminNotes: returnRequests.adminNotes,
        createdAt: returnRequests.createdAt,
        customerName: users.name,
      })
      .from(returnRequests)
      .innerJoin(users, eq(returnRequests.userId, users.id))
      .orderBy(desc(returnRequests.createdAt));

    const rows = statusFilter
      ? await query.where(eq(returnRequests.status, statusFilter))
      : await query;

    return rows.map((row) => ({
      id: row.id,
      shortOrderId: row.orderId.slice(0, 8).toUpperCase(),
      orderId: row.orderId,
      customer: row.customerName,
      reason: row.reason,
      status: row.status as ReturnStatus,
      adminNotes: row.adminNotes,
      dateRequested: row.createdAt.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}

async function getPendingCount(): Promise<number> {
  try {
    const { db, returnRequests } = await import("@amazone/db");
    const { sql, eq } = await import("drizzle-orm");

    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(returnRequests)
      .where(eq(returnRequests.status, "pending"));

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Filter tabs UI
// ---------------------------------------------------------------------------

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

function isValidStatus(value: string | undefined): value is ReturnStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "completed"
  );
}

interface FilterTabsProps {
  activeTab: FilterTab;
  pendingCount: number;
}

function FilterTabs({
  activeTab,
  pendingCount,
}: FilterTabsProps): React.ReactElement {
  return (
    <div
      className="flex gap-1 rounded-lg border bg-muted p-1"
      role="tablist"
      aria-label="Filter by return status"
    >
      {TABS.map((tab) => {
        const isActive = tab.value === activeTab;
        const href =
          tab.value === "all"
            ? "/admin/returns"
            : `/admin/returns?status=${tab.value}`;

        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value === "pending" && pendingCount > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isActive
                    ? "bg-amber-100 text-amber-800"
                    : "bg-amber-100 text-amber-700"
                )}
                aria-label={`${pendingCount} pending`}
              >
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminReturnsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const statusParam = params.status;
  const activeTab: FilterTab = isValidStatus(statusParam)
    ? statusParam
    : "all";
  const statusFilter: ReturnStatus | null = isValidStatus(statusParam)
    ? statusParam
    : null;

  const [returnList, pendingCount] = await Promise.all([
    getReturnRequests(statusFilter),
    getPendingCount(),
  ]);

  const tabLabel =
    TABS.find((t) => t.value === activeTab)?.label ?? "All";

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Return Requests</h1>
        <p className="text-muted-foreground">
          Review and process customer return requests.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <FilterTabs activeTab={activeTab} pendingCount={pendingCount} />
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle>{tabLabel} Returns</CardTitle>
          <CardDescription>
            {returnList.length === 0
              ? `No ${activeTab === "all" ? "" : `${activeTab} `}return requests found.`
              : `${returnList.length} ${activeTab === "all" ? "" : `${activeTab} `}return request${returnList.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {returnList.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No return requests to show.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="min-w-[200px]">Reason</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[110px]">Date Requested</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnList.map((row) => (
                  <ReturnRequestRow key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
