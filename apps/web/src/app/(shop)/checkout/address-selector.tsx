"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Address } from "@amazone/users";
import { fetchSavedAddresses } from "./actions";

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

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
  disabled?: boolean;
}

export function AddressSelector({
  onSelect,
  disabled,
}: AddressSelectorProps): React.ReactElement | null {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const result = await fetchSavedAddresses();
        if (!cancelled && result.success) {
          setAddresses(result.data);
        }
      } catch {
        // Silently fail -- the form still works without saved addresses
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading saved addresses...
      </div>
    );
  }

  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border bg-muted/30 p-4">
      <Label
        htmlFor="saved-address-selector"
        className="mb-2 flex items-center gap-2 text-sm font-medium"
      >
        <MapPin className="h-4 w-4" />
        Use a saved address
      </Label>
      <Select
        onValueChange={(value) => {
          const selected = addresses.find((a) => a.id === value);
          if (selected) {
            onSelect(selected);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="saved-address-selector" className="w-full">
          <SelectValue placeholder="Select a saved address" />
        </SelectTrigger>
        <SelectContent>
          {addresses.map((addr) => (
            <SelectItem key={addr.id} value={addr.id}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{addr.label}</span>
                <span className="text-muted-foreground">
                  - {addr.fullName}, {addr.city},{" "}
                  {COUNTRY_NAMES[addr.country] ?? addr.country}
                </span>
                {addr.isDefault && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    Default
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
