import Link from "next/link";
import Hero3D from "@/components/Hero3D";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-white/10">
        <Hero3D />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05070d]/40 to-[#05070d] -z-10" />
        <div className="mx-auto max-w-5xl px-6 py-28 sm:py-36 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-amber-400">
            Group scheduling, solved
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight text-white">
            Find the time.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
              Make it happen.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Everyone drops in their availability, you watch it stack up into a live
            3D skyline, pick the tallest peak, and we chase down the RSVPs so the
            meeting actually happens.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/new"
              className="rounded-full bg-amber-500 px-8 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Start a meeting
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/15 px-8 py-3 font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-sm uppercase tracking-widest text-slate-400">
          The whole loop, not just a poll
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Share availability",
              body: "Everyone taps the times that work for them — no accounts, no back-and-forth threads.",
              color: "text-sky-400",
            },
            {
              step: "02",
              title: "Watch it converge",
              body: "Availability stacks into a live 3D skyline. The tallest bar is the time that works for the most people.",
              color: "text-amber-400",
            },
            {
              step: "03",
              title: "Follow through",
              body: "Lock the winning time, collect confirmations, and hand out a calendar invite so nobody forgets.",
              color: "text-emerald-400",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
            >
              <div className={`text-xs font-mono ${item.color}`}>{item.step}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-10">
          <h2 className="text-2xl font-bold text-white">Got a group to wrangle?</h2>
          <p className="mt-3 text-slate-400">
            Set it up in under a minute. Share one link. Watch the skyline grow.
          </p>
          <Link
            href="/new"
            className="mt-6 inline-block rounded-full bg-amber-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Create your meeting
          </Link>
        </div>
      </section>
    </main>
  );
}
