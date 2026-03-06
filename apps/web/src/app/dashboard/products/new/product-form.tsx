"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  categories: Category[];
}

export function ProductForm({ categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [compareAtPriceDisplay, setCompareAtPriceDisplay] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceInCents = Math.round(parseFloat(priceDisplay) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const compareAtPriceInCents = compareAtPriceDisplay
      ? Math.round(parseFloat(compareAtPriceDisplay) * 100)
      : undefined;

    if (compareAtPriceInCents !== undefined && isNaN(compareAtPriceInCents)) {
      toast.error("Please enter a valid compare-at price");
      return;
    }

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    startTransition(async () => {
      try {
        const { createProduct } = await import("@amazone/products");
        await createProduct("placeholder-seller-id", {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceInCents,
          compareAtPrice: compareAtPriceInCents,
          stock: parseInt(stock, 10) || 0,
          categoryId: categoryId || undefined,
          isActive,
          isFeatured,
        });

        toast.success("Product created successfully!");
        router.push("/dashboard/products");
      } catch {
        toast.error(
          "Failed to create product. Make sure the database is running."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your store
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Premium Wireless Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="99.99"
                    value={priceDisplay}
                    onChange={(e) => setPriceDisplay(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Selling price displayed to customers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare-at Price ($)</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="129.99"
                    value={compareAtPriceDisplay}
                    onChange={(e) => setCompareAtPriceDisplay(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Original price — shows as strikethrough
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1 column */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label htmlFor="isActive" className="font-normal">
                  Active — visible on storefront
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(checked === true)}
                />
                <Label htmlFor="isFeatured" className="font-normal">
                  Featured — shown on homepage
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No categories available. Products can be added without a
                  category.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating…" : "Create Product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
