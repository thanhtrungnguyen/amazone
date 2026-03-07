import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileSidebarNav } from "./profile-sidebar-nav";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Mobile nav */}
      <div className="mb-6 md:hidden">
        <ProfileSidebarNav />
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-24">
            <h2 className="mb-4 text-lg font-semibold">My Account</h2>
            <ProfileSidebarNav />
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
