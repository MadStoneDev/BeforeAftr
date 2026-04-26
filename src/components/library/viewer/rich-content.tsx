"use client";

const CLASSES = [
  "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-neutral-100 [&_h1]:tracking-tight",
  "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-100 [&_h2]:tracking-tight",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-100",
  "[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-neutral-100",
  "[&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-neutral-300",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-neutral-300",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-neutral-300",
  "[&_li]:my-1 [&_li]:leading-relaxed",
  "[&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-neutral-200",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-white/[0.03] [&_pre]:p-4",
  "[&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_pre_code]:py-0",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-400",
  "[&_a]:text-neutral-100 [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-2 hover:[&_a]:decoration-white/70",
  "[&_hr]:my-8 [&_hr]:border-white/10",
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-white/10 [&_th]:bg-white/[0.03] [&_th]:p-2 [&_th]:text-left [&_th]:text-neutral-200",
  "[&_td]:border [&_td]:border-white/10 [&_td]:p-2 [&_td]:text-neutral-300",
  "[&_strong]:font-semibold [&_strong]:text-neutral-100",
  "[&_em]:italic",
].join(" ");

export function RichContent({ html }: { html: string }) {
  return (
    <div
      className={CLASSES}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
