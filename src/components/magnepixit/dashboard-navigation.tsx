import Link from "next/link";
import { IconButterfly, IconCube, IconDashboard } from "@tabler/icons-react";

export default function DashboardNavigation() {
  return (
    <section
      className={`p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white sm:rounded-xl`}
    >
      <article className={`flex-grow`}>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Merchant Dashboard
        </h1>
        <p className="text-neutral-600">
          Manage your customer orders and photo uploads
        </p>
      </article>

      <article
        className={`flex justify-center sm:justify-end items-center gap-4 w-full`}
      >
        <Link
          title={`Dashboard`}
          href={`/magnepixit/dashboard`}
          className={`p-3 flex flex-col items-center hover:bg-magnepixit-primary rounded-xl hover:text-white transition-all duration-300 ease-in-out`}
        >
          <IconDashboard size={30} />
        </Link>

        <Link
          title={`Templates`}
          href={`/magnepixit/dashboard/templates`}
          className={`p-3 flex flex-col items-center hover:bg-magnepixit-primary rounded-xl hover:text-white transition-all duration-300 ease-in-out`}
        >
          <IconCube size={28} />
        </Link>
      </article>
    </section>
  );
}
