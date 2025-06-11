import Link from "next/link";
import { IconButterfly, IconDashboard } from "@tabler/icons-react";

export default function DashboardNavigation() {
  return (
    <section className={`flex items-center bg-white rounded-xl p-6`}>
      <article className={`flex-grow`}>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          MagnePix It
          <br />
          Merchant Dashboard
        </h1>
        <p className="text-neutral-600">
          Manage your customer orders and photo uploads
        </p>
      </article>

      <article className={`flex items-center gap-4`}>
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
          <IconButterfly size={30} />
        </Link>
      </article>
    </section>
  );
}
