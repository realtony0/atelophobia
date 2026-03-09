import Link from 'next/link';
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
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.38em] text-white/40">Admin Access</p>
          <h1 className="mt-6 font-display text-5xl uppercase leading-none tracking-[0.08em] sm:text-6xl lg:text-7xl">
            Atelophobia
            <br />
            Back Office
          </h1>
          <p className="mt-6 max-w-xl text-sm text-white/55 sm:text-base">
            Interface de gestion noire et blanche pour le catalogue, les medias et les commandes. Concue pour rester lisible sur telephone comme sur desktop.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Produits</p>
              <p className="mt-3 text-sm text-white/70">Ajout, ordre, prix, visibilite, image.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Media</p>
              <p className="mt-3 text-sm text-white/70">Upload direct depuis la galerie admin.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Commandes</p>
              <p className="mt-3 text-sm text-white/70">Suivi client et changement de statut.</p>
            </div>
          </div>

          <Link href="/" className="mt-8 inline-flex text-xs uppercase tracking-[0.26em] text-white/45 transition hover:text-white">
            Retour boutique
          </Link>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Connexion</p>
            <h2 className="font-display text-3xl uppercase tracking-[0.08em] sm:text-4xl">Entrer</h2>
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
