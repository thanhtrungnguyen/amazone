"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  Heart,
  LogOut,
  LayoutDashboard,
  Settings,
  Package,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { ThemeToggle } from "@/components/theme-toggle";

const searchSchema = z.object({
  q: z.string().min(1, "Enter a search term"),
});

type SearchForm = z.infer<typeof searchSchema>;

export function SiteHeader(): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { register, handleSubmit } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: "" },
  });
  const {
    register: registerMobile,
    handleSubmit: handleMobileSubmit,
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: "" },
  });
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const isAuthenticated = status === "authenticated";
  const userName = session?.user?.name;
  const userRole = (session?.user as { role?: string })?.role;

  function onSearch(data: SearchForm) {
    router.push(`/search?q=${encodeURIComponent(data.q.trim())}`);
    setMobileSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="flex flex-col gap-4 pt-8">
              <Link href="/" className="text-lg font-medium">
                Home
              </Link>
              <Link href="/products" className="text-lg font-medium">
                Products
              </Link>
              <Link href="/categories" className="text-lg font-medium">
                Categories
              </Link>
              <Link href="/deals" className="text-lg font-medium">
                Deals
              </Link>
              {isAuthenticated && (
                <>
                  <div className="my-2 h-px bg-border" />
                  <Link href="/profile" className="text-lg font-medium">
                    My Profile
                  </Link>
                  <Link href="/profile/orders" className="text-lg font-medium">
                    My Orders
                  </Link>
                  <Link href="/dashboard" className="text-lg font-medium">
                    Seller Dashboard
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          amazone
        </Link>

        {/* Search */}
        <form onSubmit={handleSubmit(onSearch)} className="hidden flex-1 md:flex">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              type="search"
              {...register("q")}
            />
          </div>
        </form>

        {/* Nav links (desktop) */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/products"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>
          <Link
            href="/categories"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Categories
          </Link>
          <Link
            href="/deals"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Deals
          </Link>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-expanded={mobileSearchOpen}
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Wishlist */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                  {wishlistCount}
                </Badge>
              )}
              <span className="sr-only">
                Wishlist ({wishlistCount} items)
              </span>
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isAuthenticated ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Seller Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {userRole === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sign-up">Create Account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                {totalItems}
              </Badge>
            )}
            <span className="sr-only">Cart ({totalItems} items)</span>
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-4 py-2 md:hidden">
          <form onSubmit={handleMobileSubmit(onSearch)}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                type="search"
                autoFocus
                {...registerMobile("q")}
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
