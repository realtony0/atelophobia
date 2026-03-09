import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { loginAdmin } from '@/app/admin/actions';

export default function AdminLoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  if (isAdminAuthenticated()) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen bg-[#05000a] px-6 py-16 text-[#e8d5f5]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-5">
          <p className="font-display text-sm uppercase tracking-[0.4em] text-white/40">Admin</p>
          <h1 className="font-display text-5xl uppercase leading-none tracking-[0.08em] md:text-7xl">
            Back Office Atelophobia
          </h1>
          <p className="max-w-md text-sm uppercase tracking-[0.2em] text-white/50">
            Gere la boutique, les produits et toutes les commandes depuis un seul ecran.
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">Acces protege par code unique.</p>
          <Link href="/" className="inline-block text-xs uppercase tracking-[0.26em] text-white/45 transition hover:text-white">
            Retour boutique
          </Link>
        </div>

        <form action={loginAdmin} className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <div className="space-y-5">
            <div>
              <label htmlFor="code" className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-white/50">
                Code admin
              </label>
              <input
                id="code"
                type="password"
                name="code"
                inputMode="numeric"
                placeholder="1508"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
              />
            </div>

            {searchParams?.error ? (
              <p className="text-xs uppercase tracking-[0.22em] text-[#ffb4d8]">Code invalide.</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-white px-4 py-3 font-display text-sm uppercase tracking-[0.28em] text-black transition hover:bg-[#f2dfff]"
            >
              Entrer
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
