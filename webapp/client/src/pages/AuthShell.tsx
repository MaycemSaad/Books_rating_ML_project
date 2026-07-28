import type { ReactNode } from "react";
import { Icon, type IconName } from "../components/Icon";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const PANEL_IMAGE =
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80";

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: "gauge", text: "Estimate any book's rating in seconds" },
  { icon: "layers", text: "Search 11,000+ books with advanced filters" },
  { icon: "sparkles", text: "Recommendations that learn from your activity" },
  { icon: "heart", text: "Save favorites and track your reading history" },
];

/** Shared two-column shell for the login and signup screens. */
export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="grid min-h-[76vh] items-stretch gap-8 lg:grid-cols-2">
      {/* Branding panel */}
      <div className="hidden lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-forest-800 p-10 shadow-card">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${PANEL_IMAGE})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-900/92 via-forest-800/88 to-forest-700/85" />

          <div className="relative">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-gold-300 shadow-glow ring-1 ring-white/20">
              <Icon name="book" size={26} />
            </span>
            <h2 className="mt-8 font-display text-4xl font-bold leading-tight text-white">
              Your personal <span className="italic text-gold-300">literary</span> companion.
            </h2>
            <p className="mt-3 max-w-sm text-parchment-100/85">
              Everything you need to discover, evaluate and organize your next great read.
            </p>
          </div>

          <ul className="relative mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-parchment-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-200 ring-1 ring-white/15">
                  <Icon name={f.icon} size={18} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="relative mt-10 text-xs uppercase tracking-[0.2em] text-gold-200/80">
            BookWise · Reading, reimagined
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto flex w-full max-w-md items-center">
        <div className="card w-full p-8 sm:p-10">
          <div className="mb-6">
            <span className="eyebrow">Welcome</span>
            <h1 className="mt-3 font-display text-3xl font-bold text-forest-800">{title}</h1>
            <p className="mt-1.5 text-sm text-stone-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
