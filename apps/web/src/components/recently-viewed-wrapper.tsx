"use client";

import dynamic from "next/dynamic";

const RecentlyViewed = dynamic(
  () =>
    import("@/components/recently-viewed").then((mod) => mod.RecentlyViewed),
  { ssr: false }
);

export function RecentlyViewedWrapper(): React.ReactElement {
  return <RecentlyViewed />;
}
