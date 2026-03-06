export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section aria-label="Account settings">
      {children}
    </section>
  );
}
