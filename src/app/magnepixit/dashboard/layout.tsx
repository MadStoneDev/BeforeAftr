import DashboardNavigation from "@/components/magnepixit/dashboard-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className={`flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-900`}
    >
      <div className={`p-5 w-full max-w-6xl space-y-6`}>
        <DashboardNavigation />

        {children}
      </div>
    </main>
  );
}
