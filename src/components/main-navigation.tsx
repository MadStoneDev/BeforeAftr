export default function MainNavigation() {
  return (
    <nav
      className={`flex items-center justify-center min-h-16 border-b border-neutral-600 text-sm`}
    >
      <a href={`/`}>
        <img
          src={`/beforeAftr-logo.svg`}
          alt={`BeforeAftr Logo`}
          className={`w-20`}
        />
      </a>
    </nav>
  );
}
