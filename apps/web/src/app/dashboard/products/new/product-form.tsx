"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ImageUpload } from "@/components/image-upload";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  description: z.string().max(5000).optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Price must be a positive number",
    }),
  compareAtPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), {
      message: "Compare-at price must be a positive number",
    }),
  stock: z.string().refine((v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) >= 0, {
    message: "Stock must be 0 or more",
  }),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

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
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      compareAtPrice: "",
      stock: "0",
      categoryId: "",
      isActive: true,
      isFeatured: false,
    },
  });

  function onSubmit(data: ProductFormData) {
    const priceInCents = Math.round(parseFloat(data.price) * 100);
    const compareAtPriceInCents = data.compareAtPrice
      ? Math.round(parseFloat(data.compareAtPrice) * 100)
      : undefined;

    startTransition(async () => {
      try {
        const { createProduct } = await import("@amazone/products");
        await createProduct("placeholder-seller-id", {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: priceInCents,
          compareAtPrice: compareAtPriceInCents,
          stock: parseInt(data.stock, 10) || 0,
          categoryId: data.categoryId || undefined,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  rows={5}
                  {...register("description")}
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
                    {...register("price")}
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
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
                    {...register("compareAtPrice")}
                    aria-invalid={!!errors.compareAtPrice}
                  />
                  {errors.compareAtPrice && (
                    <p className="text-sm text-destructive">{errors.compareAtPrice.message}</p>
                  )}
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
                  {...register("stock")}
                  aria-invalid={!!errors.stock}
                  className="max-w-[200px]"
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">{errors.stock.message}</p>
                )}
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
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isActive" className="font-normal">
                      Active — visible on storefront
                    </Label>
                  </div>
                )}
              />
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isFeatured" className="font-normal">
                      Featured — shown on homepage
                    </Label>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No categories available. Products can be added without a
                  category.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={imageUrl}
                onUpload={(url) => setImageUrl(url)}
                onRemove={() => setImageUrl(undefined)}
                disabled={isPending}
              />
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
