import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";

export default function OrderNotFound(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Package className="h-6 w-6 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold">Order Not Found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We could not find an order with that ID. It may have been removed or the
        link is incorrect.
      </p>
      <Button asChild>
        <Link href="/profile/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Order History
        </Link>
      </Button>
    </div>
  );
}
