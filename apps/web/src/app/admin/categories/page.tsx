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
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export const metadata = {
  title: "Categories - Admin | Amazone",
  description: "Manage product categories on the platform.",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
  createdDate: string;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getCategories(): Promise<AdminCategory[]> {
  try {
    const { db, categories, products } = await import("@amazone/db");
    const { sql, desc, eq } = await import("drizzle-orm");
    const { alias } = await import("drizzle-orm/pg-core");

    const parent = alias(categories, "parent");

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentName: parent.name,
        productCount: sql<number>`count(${products.id})::int`,
        createdDate: categories.createdAt,
      })
      .from(categories)
      .leftJoin(parent, eq(categories.parentId, parent.id))
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id, parent.name)
      .orderBy(desc(categories.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentName: row.parentName,
      productCount: row.productCount,
      createdDate: row.createdDate.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}

async function getCategoryOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const { db, categories } = await import("@amazone/db");
    const { asc } = await import("drizzle-orm");

    const rows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name));

    return rows;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminCategoriesPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const [categoryList, categoryOptions] = await Promise.all([
    getCategories(),
    getCategoryOptions(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage product categories on the platform.
        </p>
      </div>

      {/* Create category form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
          <CardDescription>
            Add a new product category. The slug is auto-generated from the
            name but can be customized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm existingCategories={categoryOptions} />
        </CardContent>
      </Card>

      {/* Categories table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {categoryList.length} categories on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryList.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No categories yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryList.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.parentName ?? "--"}
                    </TableCell>
                    <TableCell className="text-right">
                      {category.productCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.createdDate}
                    </TableCell>
                    <TableCell>
                      <DeleteCategoryButton
                        categoryId={category.id}
                        categoryName={category.name}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
