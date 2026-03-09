import { redirect } from 'next/navigation';

import { loginAdmin } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default function AdminLoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  if (isAdminAuthenticated()) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-md">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Atelophobia</p>
            <h1 className="font-display text-3xl uppercase tracking-[0.08em] sm:text-4xl">Admin</h1>
            <p className="text-sm text-white/50">Acces protege par un code unique.</p>
          </div>

          <form action={loginAdmin} className="mt-8 space-y-5">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.28em] text-white/45">Code admin</span>
              <input
                type="password"
                name="code"
                inputMode="numeric"
                placeholder="1508"
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
              />
            </label>

            {searchParams?.error ? <p className="text-xs uppercase tracking-[0.22em] text-white/55">Code invalide.</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.28em] text-black transition hover:bg-zinc-200"
            >
              Ouvrir l&apos;admin
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
