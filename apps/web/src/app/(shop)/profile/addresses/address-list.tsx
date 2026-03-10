"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { type Address, MAX_ADDRESSES_PER_USER } from "@amazone/users";
import { AddressFormDialog } from "./address-form-dialog";
import { removeAddress, makeDefaultAddress } from "./actions";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  KR: "South Korea",
  VN: "Vietnam",
  SG: "Singapore",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  NZ: "New Zealand",
};

interface AddressListProps {
  addresses: Address[];
}

export function AddressList({
  addresses: initialAddresses,
}: AddressListProps): React.ReactElement {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null
  );
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshAddresses = useCallback(() => {
    // Force a page reload to get fresh data from the server
    window.location.reload();
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingAddressId) return;
    setIsDeleting(true);
    try {
      const result = await removeAddress(deletingAddressId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Address deleted successfully.");
      setAddresses((prev) => prev.filter((a) => a.id !== deletingAddressId));
      setDeletingAddressId(null);
      refreshAddresses();
    } catch {
      toast.error("Failed to delete address.");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingAddressId, refreshAddresses]);

  const handleSetDefault = useCallback(
    async (addressId: string) => {
      setSettingDefaultId(addressId);
      try {
        const result = await makeDefaultAddress(addressId);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Default address updated.");
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === addressId,
          }))
        );
      } catch {
        toast.error("Failed to set default address.");
      } finally {
        setSettingDefaultId(null);
      }
    },
    []
  );

  const canAddMore = addresses.length < MAX_ADDRESSES_PER_USER;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {addresses.length} of {MAX_ADDRESSES_PER_USER} addresses used
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            disabled={!canAddMore}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>

        {/* Address Cards */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No saved addresses</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a shipping address to make checkout faster.
                </p>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={
                  address.isDefault
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : ""
                }
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{address.label}</CardTitle>
                    {address.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => void handleSetDefault(address.id)}
                        disabled={settingDefaultId === address.id}
                        title="Set as default"
                        aria-label="Set as default address"
                      >
                        {settingDefaultId === address.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingAddress(address)}
                      title="Edit address"
                      aria-label={`Edit ${address.label} address`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingAddressId(address.id)}
                      title="Delete address"
                      aria-label={`Delete ${address.label} address`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="font-medium">{address.fullName}</p>
                    <p className="text-muted-foreground">
                      {address.streetAddress}
                    </p>
                    <p className="text-muted-foreground">
                      {address.city}
                      {address.state ? `, ${address.state}` : ""}{" "}
                      {address.zipCode}
                    </p>
                    <p className="text-muted-foreground">
                      {COUNTRY_NAMES[address.country] ?? address.country}
                    </p>
                    {address.phone && (
                      <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {address.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddressFormDialog
        open={showAddDialog || !!editingAddress}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingAddress(undefined);
          }
        }}
        address={editingAddress}
        onSuccess={refreshAddresses}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingAddressId}
        onOpenChange={(open) => {
          if (!open) setDeletingAddressId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
