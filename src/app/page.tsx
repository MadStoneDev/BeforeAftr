import Image from "next/image";
import ImageComparison from "@/components/image-comparison";

export default function Home() {
  return (
    <div
      className={`p-3 sm:p-5 flex flex-col w-full min-h-dvh max-h-dvh gap-16`}
    >
      <main
        className={`flex-grow flex flex-col gap-8 items-center sm:items-start w-full`}
      >
        <ImageComparison />
      </main>
      <footer
        className={`pt-3 flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-start sm:justify-between border-t border-neutral-500 text-xs text-neutral-400/80`}
      >
        <p>Copyright © 2024 BeforeAftr</p>
        <p>
          Product of{" "}
          <a href={`https://madstone.dev`} className={`text-neutral-200`}>
            MadStone Dev
          </a>
        </p>
      </footer>
    </div>
  );
}
