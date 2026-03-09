import Image from 'next/image';
import { unstable_noStore as noStore } from 'next/cache';

import {
  createProduct,
  logoutAdmin,
  purgeCancelledOrders,
  saveProductSettings,
  setOrderStatus,
  updateAdminCode
} from '@/app/admin/actions';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getOrders, getProducts, getSiteSettings } from '@/lib/store';

function getSuccessMessage(searchParams?: Record<string, string | string[] | undefined>) {
  if (searchParams?.created) {
    return 'Nouveau produit ajoute.';
  }

  if (searchParams?.saved) {
    return 'Produit mis a jour.';
  }

  if (searchParams?.updated) {
    return 'Commande mise a jour.';
  }

  if (searchParams?.purged) {
    return 'Commandes annulees supprimees.';
  }

  if (searchParams?.coded) {
    return 'Code admin mis a jour.';
  }

  return null;
}

function getErrorMessage(searchParams?: Record<string, string | string[] | undefined>) {
  switch (searchParams?.error) {
    case 'product':
      return 'Verifie le code produit, le nom, le prix, la position et les dimensions.';
    case 'image':
      return 'Ajoute une image valide ou renseigne largeur et hauteur.';
    case 'upload':
      return "L'upload d'images n'est pas disponible sur cet environnement.";
    case 'order':
      return 'Commande introuvable.';
    case 'duplicate-product':
      return 'Ce code produit existe deja.';
    case 'invalid-code':
      return 'Le code admin doit contenir entre 4 et 12 chiffres.';
    case 'code-match':
      return 'Les deux champs du code admin doivent etre identiques.';
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  requireAdminAuth();
  noStore();

  const [products, orders, settings] = await Promise.all([getProducts(), getOrders(), getSiteSettings()]);
  const successMessage = getSuccessMessage(searchParams);
  const errorMessage = getErrorMessage(searchParams);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const activeProducts = products.filter((product) => product.active).length;
  const hiddenProducts = products.length - activeProducts;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const securityUpdatedAt = settings.updatedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(settings.updatedAt))
    : 'Jamais';

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.38em] text-white/45">Atelophobia Admin</p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl uppercase tracking-[0.08em] sm:text-5xl">Back Office</h1>
                <p className="max-w-2xl text-sm text-white/55">
                  Gestion boutique, media et commandes sur une interface noire et blanche, propre sur mobile comme sur desktop.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <form action={purgeCancelledOrders}>
                <button
                  type="submit"
                  className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:text-white"
                >
                  Purger annulees
                </button>
              </form>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="rounded-full bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                >
                  Deconnexion
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Produits</p>
              <p className="mt-3 text-3xl font-semibold">{products.length}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">{activeProducts} actifs</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Masques</p>
              <p className="mt-3 text-3xl font-semibold">{hiddenProducts}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">produits caches</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Commandes</p>
              <p className="mt-3 text-3xl font-semibold">{orders.length}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">{pendingOrders} en attente</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Volume</p>
              <p className="mt-3 text-3xl font-semibold">${totalRevenue}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">total encaisse</p>
            </div>
          </div>
        </header>

        {successMessage ? (
          <div className="rounded-[24px] border border-white/15 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/75">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[24px] border border-white/15 bg-white/[0.02] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/65">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Catalogue</p>
                  <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.08em]">Ajouter un produit</h2>
                </div>
                <p className="text-xs text-white/45">Upload depuis la galerie ou URL manuelle avec dimensions.</p>
              </div>

              <form action={createProduct} encType="multipart/form-data" className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Code produit</span>
                    <input
                      name="productCode"
                      placeholder="ex: pink-hoodie"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Nom</span>
                    <input
                      name="name"
                      placeholder="Nom produit"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Prix USD</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Position</span>
                    <input
                      name="position"
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={products.length + 1}
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Layout</span>
                    <select
                      name="layout"
                      defaultValue="duo"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    >
                      <option value="duo">Duo</option>
                      <option value="solo">Solo</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Largeur</span>
                    <input
                      name="width"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="auto si upload"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Hauteur</span>
                    <input
                      name="height"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="auto si upload"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2 xl:col-span-3">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">URL image</span>
                    <input
                      name="image"
                      placeholder="/products/mon-produit.jpg ou https://..."
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Upload image</span>
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      className="block w-full rounded-2xl border border-dashed border-white/15 bg-black px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-black"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/70 xl:self-end">
                    <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-white" />
                    Produit actif
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-xs text-white/45">
                    Si un fichier est selectionne, il remplace l&apos;URL et les dimensions sont detectees automatiquement.
                  </p>
                  <button
                    type="submit"
                    className="rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                  >
                    Ajouter le produit
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Catalogue</p>
                  <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.08em]">Modifier les produits</h2>
                </div>
                <p className="text-xs text-white/45">Chaque fiche permet de remplacer l&apos;image, le prix et l&apos;ordre d&apos;affichage.</p>
              </div>

              <div className="mt-6 space-y-5">
                {products.map((product) => (
                  <form
                    key={product.id}
                    action={saveProductSettings}
                    encType="multipart/form-data"
                    className="rounded-[28px] border border-white/10 bg-black/70 p-4 sm:p-5"
                  >
                    <input type="hidden" name="productId" value={product.id} />

                    <div className="grid gap-5 xl:grid-cols-[180px_1fr]">
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
                          <Image src={product.image} alt={product.name} width={product.width} height={product.height} sizes="180px" className="aspect-[4/5] h-full w-full object-cover" />
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
                          <p className="uppercase tracking-[0.22em] text-white/35">Code</p>
                          <p className="mt-2 break-all font-medium text-white/80">{product.id}</p>
                          <p className="mt-4 uppercase tracking-[0.22em] text-white/35">Dimensions</p>
                          <p className="mt-2 text-white/80">
                            {product.width} x {product.height}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <label className="space-y-2 xl:col-span-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Nom</span>
                            <input
                              name="name"
                              defaultValue={product.name}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Prix USD</span>
                            <input
                              name="price"
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={product.price}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Position</span>
                            <input
                              name="position"
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={product.position}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Layout</span>
                            <select
                              name="layout"
                              defaultValue={product.layout}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            >
                              <option value="duo">Duo</option>
                              <option value="solo">Solo</option>
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Largeur</span>
                            <input
                              name="width"
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={product.width}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Hauteur</span>
                            <input
                              name="height"
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={product.height}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/70 xl:self-end">
                            <input type="checkbox" name="active" defaultChecked={product.active} className="h-4 w-4 accent-white" />
                            Produit actif
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">URL image</span>
                            <input
                              name="image"
                              defaultValue={product.image}
                              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Remplacer l&apos;image</span>
                            <input
                              name="imageFile"
                              type="file"
                              accept="image/*"
                              className="block w-full rounded-2xl border border-dashed border-white/15 bg-black px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-black"
                            />
                          </label>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-white/45">Le code produit reste stable pour ne pas casser les commandes existantes.</p>
                          <button
                            type="submit"
                            className="rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Securite</p>
                <h2 className="font-display text-2xl uppercase tracking-[0.08em]">Code admin</h2>
                <p className="text-sm text-white/50">Le login admin repose sur un seul code. Change-le ici sans toucher au code source.</p>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/60 p-4 text-sm text-white/65">
                <div className="flex items-center justify-between gap-3">
                  <span>Etat</span>
                  <strong className="text-white">{settings.adminCode ? 'Code personnalise' : 'Code par defaut actif'}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span>Derniere mise a jour</span>
                  <strong className="text-white">{securityUpdatedAt}</strong>
                </div>
              </div>

              <form action={updateAdminCode} className="mt-5 space-y-4">
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Nouveau code</span>
                  <input
                    name="adminCode"
                    type="password"
                    inputMode="numeric"
                    placeholder="4 a 12 chiffres"
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Confirmer le code</span>
                  <input
                    name="confirmAdminCode"
                    type="password"
                    inputMode="numeric"
                    placeholder="Repete le code"
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                >
                  Mettre a jour le code
                </button>
              </form>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Operations</p>
                  <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.08em]">Commandes</h2>
                </div>
                <p className="text-xs text-white/45">Statuts, client, recap panier.</p>
              </div>

              {orders.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/60 p-6 text-[11px] uppercase tracking-[0.24em] text-white/40">
                  Aucune commande pour le moment.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <article key={order.id} className="rounded-[28px] border border-white/10 bg-black/70 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-display text-xl uppercase tracking-[0.08em]">{order.id}</h3>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                            {new Date(order.createdAt).toLocaleString('fr-FR')} - {order.itemCount} article(s) - ${order.total}
                          </p>
                        </div>

                        <form action={setOrderStatus} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input type="hidden" name="orderId" value={order.id} />
                          <select
                            name="status"
                            defaultValue={order.status}
                            className="rounded-full border border-white/10 bg-black px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white outline-none transition focus:border-white/30"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded-full bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                          >
                            Enregistrer
                          </button>
                        </form>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Client</p>
                          <div className="mt-3 space-y-2 text-sm text-white/80">
                            <p>{order.customer.country} ({order.customer.dialCode})</p>
                            <p>{order.customer.phone}</p>
                            <p>{order.customer.address}</p>
                            <p>{order.customer.email || 'Sans email'}</p>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Panier</p>
                          <div className="mt-3 space-y-3">
                            {order.items.map((item) => (
                              <div key={`${order.id}-${item.productId}-${item.size}`} className="flex items-start justify-between gap-3 text-sm text-white/80">
                                <div>
                                  <p>{item.name}</p>
                                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                                    {item.size} - {item.quantity}x
                                  </p>
                                </div>
                                <span>${item.lineTotal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
