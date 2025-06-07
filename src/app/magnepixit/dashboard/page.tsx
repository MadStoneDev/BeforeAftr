import { IconDownload } from "@tabler/icons-react";

export const metadata = {
  title: "MagnePixIt | BeforeAftr",
  description: "MagnePixIt's very own photo upload and cropping tool.",
};

export default function MagnePixItDashboardPage() {
  return (
    <main className={`flex justify-center h-dvh w-full text-neutral-900`}>
      <div className={`p-4 w-full max-w-5xl bg-white space-y-6`}>
        <h1 className={`text-xl font-bold`}>Dashboard</h1>

        <section className={`space-y-3`}>
          <div className={`h-[1px] w-full bg-neutral-200`}></div>

          <article
            className={`group px-4 py-6 flex items-center gap-3 shadow-none hover:shadow-xl shadow-neutral-900/10 transition-all duration-500 ease-in-out`}
          >
            <div className={`flex-grow`}>
              <h3 className={`font-bold`}>
                Order: <span className={`font-normal`}>1234567890</span>
              </h3>
              <p>Order Status: Pending</p>
              <div className={`mt-4 flex items-center gap-2`}>
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
              </div>
            </div>
            <button
              className={`opacity-0 group-hover:opacity-100 p-2 flex flex-col items-center justify-center max-w-[100px] hover:bg-[#5B9994] hover:text-white text-sm transition-all duration-300 ease-in-out`}
            >
              <IconDownload size={30} strokeWidth={2} />
            </button>
          </article>

          <div className={`h-[1px] w-full bg-neutral-200`}></div>

          <article
            className={`group px-4 py-6 flex items-center gap-3 shadow-none hover:shadow-xl shadow-neutral-900/10 transition-all duration-500 ease-in-out`}
          >
            <div className={`flex-grow`}>
              <h3 className={`font-bold`}>
                Order: <span className={`font-normal`}>1234567890</span>
              </h3>
              <p>Order Status: Pending</p>
              <div className={`mt-4 flex items-center gap-2`}>
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
              </div>
            </div>
            <button
              className={`opacity-0 group-hover:opacity-100 p-2 flex flex-col items-center justify-center max-w-[100px] hover:bg-[#5B9994] hover:text-white text-sm transition-all duration-300 ease-in-out`}
            >
              <IconDownload size={30} strokeWidth={2} />
            </button>
          </article>

          <div className={`h-[1px] w-full bg-neutral-200`}></div>

          <article
            className={`group px-4 py-6 flex items-center gap-3 shadow-none hover:shadow-xl shadow-neutral-900/10 transition-all duration-500 ease-in-out`}
          >
            <div className={`flex-grow`}>
              <h3 className={`font-bold`}>
                Order: <span className={`font-normal`}>1234567890</span>
              </h3>
              <p>Order Status: Pending</p>
              <div className={`mt-4 flex items-center gap-2`}>
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
                <img src={"/"} />
              </div>
            </div>
            <button
              className={`opacity-0 group-hover:opacity-100 p-2 flex flex-col items-center justify-center max-w-[100px] hover:bg-[#5B9994] hover:text-white text-sm transition-all duration-300 ease-in-out`}
            >
              <IconDownload size={30} strokeWidth={2} />
            </button>
          </article>

          <div className={`h-[1px] w-full bg-neutral-200`}></div>
        </section>
        <p className={`text-center text-sm italic text-neutral-400`}>
          -- End of list --
        </p>
      </div>
    </main>
  );
}
