"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory } from "./actions";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!confirm(`Delete category "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        toast.success("Category deleted");
      } else {
        toast.error(result.error ?? "Failed to delete category");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      aria-label={`Delete category ${categoryName}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
