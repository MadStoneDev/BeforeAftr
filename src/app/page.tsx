import ImageComparison from "@/components/image-comparison";

export default function Home() {
  return (
    <div
      className={`px-3 sm:px-5 flex flex-col justify-start w-full min-h-screen max-h-dvh`}
    >
      <nav
        className={`flex items-center justify-center min-h-16 border-b border-neutral-600`}
      >
        <a href={`/`}>
          <img
            src={`/beforeAftr-logo.svg`}
            alt={`BeforeAftr Logo`}
            className={`w-20`}
          />
        </a>
      </nav>

      <main
        className={`flex-grow py-5 flex flex-col items-center sm:items-start w-full`}
      >
        <ImageComparison />
      </main>
      <footer
        className={`py-3 flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-start sm:justify-between border-t border-neutral-600 text-xs text-neutral-500`}
      >
        <p>
          Copyright © 2024{" "}
          <a href={`/`} className={`text-neutral-300`}>
            BeforeAftr
          </a>
        </p>
        <p>
          Product of{" "}
          <a href={`https://madstone.dev`} className={`text-neutral-300`}>
            MadStone Dev
          </a>
        </p>
      </footer>
    </div>
  );
}
