import type { Metadata } from "next";
import { CompareContent } from "./compare-content";

export const metadata: Metadata = {
  title: "Compare Products — Amazone",
  description:
    "Compare products side by side to find the best option for your needs.",
};

export default function ComparePage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Compare Products</h1>
      <CompareContent />
    </div>
  );
}
