"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldBan,
  UserCog,
  ShoppingBag,
  Loader2,
  Check,
} from "lucide-react";
import { updateUserRole, banUser, unbanUser } from "./actions";
import type { AdminUser } from "./actions";

// ---------------------------------------------------------------------------
// Role config
// ---------------------------------------------------------------------------

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UserActionsCellProps {
  user: AdminUser;
}

export function UserActionsCell({
  user,
}: UserActionsCellProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [showBanDialog, setShowBanDialog] = useState(false);

  function handleRoleChange(newRole: string): void {
    if (newRole === user.role) return;
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if (result.success) {
        toast.success(`Role changed to ${newRole}`);
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    });
  }

  function handleBanToggle(): void {
    if (user.isBanned) {
      // Unban immediately, no confirmation needed
      startTransition(async () => {
        const result = await unbanUser(user.id);
        if (result.success) {
          toast.success("User unbanned");
        } else {
          toast.error(result.error ?? "Failed to unban user");
        }
      });
    } else {
      // Show confirmation dialog before banning
      setShowBanDialog(true);
    }
  }

  function handleConfirmBan(): void {
    startTransition(async () => {
      const result = await banUser(user.id);
      if (result.success) {
        toast.success("User banned");
        setShowBanDialog(false);
      } else {
        toast.error(result.error ?? "Failed to ban user");
        setShowBanDialog(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isPending}
            aria-label={`Actions for ${user.name}`}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Change Role submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <UserCog className="h-4 w-4" />
              Change Role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {ROLES.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  disabled={isPending}
                  className="gap-2"
                >
                  {role.value === user.role && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className={role.value === user.role ? "font-medium" : ""}>
                    {role.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Ban / Unban */}
          {user.role !== "admin" && (
            <DropdownMenuItem
              onClick={handleBanToggle}
              disabled={isPending}
              className={
                user.isBanned
                  ? "gap-2 text-green-700 focus:text-green-700"
                  : "gap-2 text-red-700 focus:text-red-700"
              }
            >
              {user.isBanned ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Unban User
                </>
              ) : (
                <>
                  <ShieldBan className="h-4 w-4" />
                  Ban User
                </>
              )}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* View Orders — links to admin orders page filtered by user */}
          <DropdownMenuItem asChild className="gap-2">
            <a href={`/admin/orders?userId=${user.id}`}>
              <ShoppingBag className="h-4 w-4" />
              View Orders
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban{" "}
              <span className="font-medium text-foreground">{user.name}</span> (
              {user.email})? This will prevent them from accessing the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBan}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
