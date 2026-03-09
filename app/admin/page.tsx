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
import { getDisplayImageSrc } from '@/lib/product-images';
import { SIZES, type ProductSize } from '@/lib/products';
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
    case 'sizes':
      return 'Selectionne au moins une taille pour le produit.';
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

function SectionHeader({
  id,
  eyebrow,
  title,
  note
}: {
  id: string;
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <div id={id} className="scroll-mt-28 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl uppercase tracking-[0.08em] sm:text-3xl">{title}</h2>
        {note ? <p className="text-xs text-white/45">{note}</p> : null}
      </div>
    </div>
  );
}

function SizeSelector({
  selectedSizes
}: {
  selectedSizes: ProductSize[];
}) {
  return (
    <div className="space-y-2 xl:col-span-3">
      <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Tailles actives</span>
      <div className="flex flex-wrap gap-2">
        {SIZES.map((size) => (
          <label
            key={size}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70"
          >
            <input type="checkbox" name="sizes" value={size} defaultChecked={selectedSizes.includes(size)} className="h-4 w-4 accent-white" />
            {size}
          </label>
        ))}
      </div>
    </div>
  );
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
        <header className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)] bg-black p-5 shadow-[0_30px_120px_rgba(255,255,255,0.05)] sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">Atelophobia</p>
                <h1 className="font-display text-4xl uppercase tracking-[0.08em] sm:text-5xl">Admin</h1>
              </div>

              <nav className="flex flex-wrap gap-2">
                <a href="#overview" className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:bg-white/[0.04]">
                  Vue globale
                </a>
                <a href="#create-product" className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:bg-white/[0.04]">
                  Ajouter
                </a>
                <a href="#manage-products" className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:bg-white/[0.04]">
                  Produits
                </a>
                <a href="#security" className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:bg-white/[0.04]">
                  Securite
                </a>
                <a href="#orders" className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition hover:border-white/35 hover:bg-white/[0.04]">
                  Commandes
                </a>
              </nav>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
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

        <section id="overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 scroll-mt-28">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Produits</p>
            <p className="mt-4 text-4xl font-semibold text-white">{products.length}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">{activeProducts} actifs</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Masques</p>
            <p className="mt-4 text-4xl font-semibold text-white">{hiddenProducts}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">produits caches</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Commandes</p>
            <p className="mt-4 text-4xl font-semibold text-white">{orders.length}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">{pendingOrders} en attente</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Volume</p>
            <p className="mt-4 text-4xl font-semibold text-white">${totalRevenue}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">chiffre total</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <SectionHeader
                id="create-product"
                eyebrow="Catalogue"
                title="Ajouter un produit"
                note="Formulaire separe, image en upload ou URL."
              />

              <form action={createProduct} encType="multipart/form-data" className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Code produit</span>
                    <input
                      name="productCode"
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Nom</span>
                    <input
                      name="name"
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
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    />
                  </label>
                  <SizeSelector selectedSizes={SIZES} />
                  <label className="space-y-2 xl:col-span-3">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">URL image</span>
                    <input
                      name="image"
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
                  <p className="max-w-2xl text-xs text-white/45">Le fichier remplace automatiquement le lien image.</p>
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
              <SectionHeader
                id="manage-products"
                eyebrow="Catalogue"
                title="Produits"
                note="Chaque produit ouvre son propre panneau avec un bouton de sauvegarde."
              />

              <div className="mt-6 space-y-4">
                {products.map((product) => (
                  <details key={product.id} className="group rounded-[28px] border border-white/10 bg-black/70 open:bg-white/[0.03]">
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5">
                      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]">
                        <Image
                          src={getDisplayImageSrc(product.image)}
                          alt={product.name}
                          width={88}
                          height={110}
                          sizes="88px"
                          className="h-[88px] w-[70px] object-cover sm:h-[104px] sm:w-[82px]"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="truncate font-display text-lg uppercase tracking-[0.08em] text-white">{product.name}</p>
                        <p className="truncate text-xs uppercase tracking-[0.2em] text-white/40">{product.id}</p>
                        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
                          <span>${product.price}</span>
                          <span>{product.layout}</span>
                          <span>#{product.position}</span>
                          <span>{product.active ? 'actif' : 'cache'}</span>
                        </div>
                      </div>

                      <div className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition group-open:bg-white group-open:text-black">
                        Modifier
                      </div>
                    </summary>

                    <div className="border-t border-white/10 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                      <form action={saveProductSettings} encType="multipart/form-data" className="space-y-5">
                        <input type="hidden" name="productId" value={product.id} />

                        <div className="grid gap-5 xl:grid-cols-[180px_1fr]">
                          <div className="space-y-3">
                            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
                              <Image
                                src={getDisplayImageSrc(product.image)}
                                alt={product.name}
                                width={product.width}
                                height={product.height}
                                sizes="180px"
                                className="aspect-[4/5] h-full w-full object-cover"
                              />
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
                              <SizeSelector selectedSizes={product.availableSizes} />
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
                                <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Remplacement image</span>
                                <input
                                  name="imageFile"
                                  type="file"
                                  accept="image/*"
                                  className="block w-full rounded-2xl border border-dashed border-white/15 bg-black px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-black"
                                />
                              </label>
                            </div>

                            <div className="flex justify-end border-t border-white/10 pt-4">
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
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <SectionHeader id="security" eyebrow="Securite" title="Code admin" note="Le code reste masque dans toute interface." />

              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/60 p-4 text-sm text-white/65">
                <div className="flex items-center justify-between gap-3">
                  <span>Acces</span>
                  <strong className="text-white">Protege</strong>
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
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">Confirmer</span>
                  <input
                    name="confirmAdminCode"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition hover:bg-zinc-200"
                >
                  Mettre a jour
                </button>
              </form>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <SectionHeader id="orders" eyebrow="Operations" title="Commandes" note="Chaque commande ouvre son propre panneau avec un bouton dedie." />

              {orders.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/60 p-6 text-[11px] uppercase tracking-[0.24em] text-white/40">
                  Aucune commande pour le moment.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <details key={order.id} className="group rounded-[28px] border border-white/10 bg-black/70 open:bg-white/[0.03]">
                      <summary className="flex cursor-pointer list-none flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="space-y-2">
                          <p className="font-display text-xl uppercase tracking-[0.08em] text-white">{order.id}</p>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                            {new Date(order.createdAt).toLocaleString('fr-FR')} - {order.itemCount} article(s) - ${order.total}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                            {order.status}
                          </span>
                          <span className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75 transition group-open:bg-white group-open:text-black">
                            Ouvrir
                          </span>
                        </div>
                      </summary>

                      <div className="border-t border-white/10 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
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

                        <form action={setOrderStatus} className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
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
                            Mettre a jour
                          </button>
                        </form>
                      </div>
                    </details>
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
