import DashboardNavigation from "@/components/magnepixit/dashboard-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className={`flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-900 transition-all duration-300 ease-in-out`}
    >
      <div
        className={`sm:p-5 w-full max-w-6xl space-y-3 sm:space-y-6 transition-all duration-300 ease-in-out`}
      >
        <DashboardNavigation />

        {children}
      </div>
    </main>
  );
}
