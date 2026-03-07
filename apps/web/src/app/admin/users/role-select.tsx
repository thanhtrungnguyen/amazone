"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUserRole } from "./actions";

interface RoleSelectProps {
  userId: string;
  currentRole: string;
}

const roles = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
] as const;

export function RoleSelect({
  userId,
  currentRole,
}: RoleSelectProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: string): void {
    if (newRole === currentRole) return;

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success("Role updated successfully");
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    });
  }

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={handleRoleChange}
      disabled={isPending}
    >
      <SelectTrigger
        className="w-[120px]"
        aria-label={`Change role for user`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
