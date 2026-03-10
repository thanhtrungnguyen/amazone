"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminUsersError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage platform users, roles, and account statuses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading the users list. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {error.digest ? `Error ID: ${error.digest}` : error.message}
          </p>
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
