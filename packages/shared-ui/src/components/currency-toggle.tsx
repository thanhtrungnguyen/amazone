"use client";

import { useState } from "react";
import type { SupportedLocale } from "@amazone/shared-utils";

interface CurrencyToggleProps {
  locale: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
}

export function CurrencyToggle({
  locale,
  onChange,
}: CurrencyToggleProps): React.ReactElement {
  return (
    <div className="inline-flex rounded-md border text-sm">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-3 py-1.5 transition-colors ${
          locale === "en"
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-50"
        } rounded-l-md`}
      >
        $ USD
      </button>
      <button
        type="button"
        onClick={() => onChange("vi")}
        className={`px-3 py-1.5 transition-colors ${
          locale === "vi"
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-50"
        } rounded-r-md`}
      >
        ₫ VND
      </button>
    </div>
  );
}
