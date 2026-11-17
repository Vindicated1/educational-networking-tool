import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Learn together",
    description: "Ask course questions, exchange ideas, and learn from a community that understands your academic journey.",
  },
  {
    number: "02",
    title: "Share knowledge",
    description: "Find course materials in one organized library and contribute useful resources to your peers.",
  },
  {
    number: "03",
    title: "Build what matters",
    description: "Discover student-led projects and connect with collaborators who bring complementary skills.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9fc]">
        <div className="absolute -right-36 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-900 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              THE UNIVERSITY OF IBADAN ACADEMIC NETWORK
            </div>
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Your campus community,{" "}
              <span className="text-blue-900">working together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A shared space for University of Ibadan students and faculty to discuss coursework, exchange resources, and find people to build with.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/10 transition hover:bg-blue-800">
                Join the community
              </Link>
              <Link href="/dashboard" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
                Explore the platform
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium text-slate-500">
              For University of Ibadan students and faculty
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-200/60 to-amber-100/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-30px_rgba(15,35,65,0.35)] sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">Community snapshot</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Learning in motion</h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">Connected</span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">CSC476 · Research Methodology · Question</span>
                    <span className="text-xs font-medium text-slate-500">Course forum</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">How should we structure a strong project defence?</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">PO</span>
                    Faculty-verified guidance
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f5f7fa] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resource library</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Course notes, together</p>
                    <p className="mt-1 text-xs text-slate-500">Find materials shared by your community</p>
                  </div>
                  <div className="rounded-xl bg-[#f5f7fa] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project board</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Ideas become teams</p>
                    <p className="mt-1 text-xs text-slate-500">Meet people with the skills you need</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                A more connected academic experience
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Made for campus life</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to move forward.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Bring the everyday parts of academic collaboration into one thoughtful, trusted space.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-900">{feature.number}</span>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#102b50]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Start collaborating</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Bring your next good idea to campus.</h2>
          </div>
          <Link href="/register" className="inline-flex w-fit items-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-50">
            Create your account
          </Link>
        </div>
      </section>
    </main>
  );
}
