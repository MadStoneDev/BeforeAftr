import { Sparkles } from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    images: 50,
    price: "$0",
    description: "Try AI tagging on your first 50 images",
    cta: "Included",
    disabled: true,
  },
  {
    name: "Explorer",
    images: 500,
    price: "$2.99",
    description: "Great for a single collection",
    cta: "Buy Explorer",
    disabled: false,
  },
  {
    name: "Adventurer",
    images: 2000,
    price: "$7.99",
    description: "For medium-sized libraries",
    cta: "Buy Adventurer",
    popular: true,
    disabled: false,
  },
  {
    name: "Cartographer",
    images: 10000,
    price: "$29.99",
    description: "For massive collections",
    cta: "Buy Cartographer",
    disabled: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0E0F11] text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/library"
          className="mb-8 inline-flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← Back to Library
        </Link>

        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles size={24} className="text-amber-400" />
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Image Analysis
            </h1>
          </div>
          <p className="text-sm text-neutral-400">
            Automatically tag your images with AI-powered analysis.
            <br />
            Purchase credits — no account required.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-5 ${
                tier.popular
                  ? "border-amber-500/40 bg-amber-500/[0.03]"
                  : "border-white/[0.08] bg-white/[0.01]"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
                  Popular
                </span>
              )}
              <h3 className="text-sm font-medium text-neutral-200">
                {tier.name}
              </h3>
              <p className="mt-1 text-[11px] text-neutral-500">
                {tier.description}
              </p>
              <div className="my-4">
                <span className="text-2xl font-bold">{tier.price}</span>
                {!tier.disabled && (
                  <span className="ml-1 text-xs text-neutral-500">one-time</span>
                )}
              </div>
              <p className="mb-4 text-xs text-neutral-400">
                {tier.images.toLocaleString()} images
              </p>
              <button
                type="button"
                disabled={tier.disabled}
                className={`mt-auto inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                  tier.popular
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : tier.disabled
                      ? "cursor-default border border-white/[0.08] text-neutral-600"
                      : "border border-white/[0.08] bg-white/[0.04] text-neutral-200 hover:bg-white/[0.08]"
                } disabled:opacity-60`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-white/[0.06] bg-white/[0.01] p-6">
          <h2 className="mb-3 text-sm font-medium text-neutral-200">
            How it works
          </h2>
          <ol className="space-y-2 text-xs text-neutral-400">
            <li>
              1. Purchase a credit pack above — no account needed
            </li>
            <li>
              2. After payment, you&apos;ll receive a unique credit key
            </li>
            <li>
              3. Enter the key in the Library AI panel to activate your credits
            </li>
            <li>
              4. Select images and click &quot;Analyze&quot; — AI generates
              descriptive tags automatically
            </li>
          </ol>
          <p className="mt-4 text-[11px] text-neutral-600">
            Powered by Claude Haiku 4.5 Vision. Tags include setting,
            environment, features, mood, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
