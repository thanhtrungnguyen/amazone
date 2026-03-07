"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@amazone/shared-utils";
import {
  getSearchSuggestions,
  type SearchSuggestion,
} from "@/app/(shop)/search/actions";

interface SearchAutocompleteProps {
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
  className?: string;
}

export function SearchAutocomplete({
  placeholder = "Search products...",
  autoFocus = false,
  onSubmit,
  className,
}: SearchAutocompleteProps): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getSearchSuggestions(trimmed);
      setSuggestions(results);
      setIsOpen(results.length > 0 || trimmed.length >= 2);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(value: string): void {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  }

  function navigateToProduct(slug: string): void {
    setIsOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
    onSubmit?.();
  }

  function handleSearch(): void {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    onSubmit?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          navigateToProduct(suggestions[activeIndex].slug);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        role="search"
        aria-label="Search products"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            className="pl-9 pr-9"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 || query.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="search-suggestions-list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {isOpen && (
        <div
          id="search-suggestions-list"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg"
        >
          {suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => navigateToProduct(suggestion.slug)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border bg-muted">
                    {suggestion.image ? (
                      <Image
                        src={suggestion.image}
                        alt={suggestion.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{suggestion.name}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(suggestion.price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No products found
              </div>
            )
          )}

          {query.trim().length >= 2 && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
              onClick={handleSearch}
            >
              <Search className="h-3.5 w-3.5" />
              Search for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
