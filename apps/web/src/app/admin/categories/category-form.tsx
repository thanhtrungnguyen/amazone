"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCategory } from "./actions";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryFormProps {
  existingCategories: CategoryOption[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({
  existingCategories,
}: CategoryFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [autoSlug, setAutoSlug] = useState(true);

  function handleNameChange(value: string): void {
    setName(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string): void {
    setAutoSlug(false);
    setSlug(value);
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    startTransition(async () => {
      const result = await createCategory(
        name,
        slug,
        parentId && parentId !== "none" ? parentId : undefined
      );
      if (result.success) {
        toast.success("Category created successfully");
        setName("");
        setSlug("");
        setParentId("");
        setAutoSlug(true);
      } else {
        toast.error(result.error ?? "Failed to create category");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            placeholder="e.g. Electronics"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            placeholder="e.g. electronics"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-parent">Parent Category (optional)</Label>
        <Select
          value={parentId}
          onValueChange={setParentId}
          disabled={isPending}
        >
          <SelectTrigger id="category-parent" className="w-full sm:w-[280px]">
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (top-level)</SelectItem>
            {existingCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? "Creating..." : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
