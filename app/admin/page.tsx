import { unstable_noStore as noStore } from 'next/cache';

import { logoutAdmin, purgeCancelledOrders, saveProductSettings, setOrderStatus } from '@/app/admin/actions';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getOrders, getProducts } from '@/lib/store';

export default async function AdminPage({
  searchParams
}: {
  searchParams?: { saved?: string; updated?: string; purged?: string; error?: string };
}) {
  requireAdminAuth();
  noStore();

  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <main className="min-h-screen bg-[#05000a] px-6 py-8 text-[#e8d5f5]">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-white/35">Atelophobia Admin</p>
            <h1 className="font-display text-4xl uppercase tracking-[0.08em] md:text-6xl">Boutique et commandes</h1>
            <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.26em] text-white/45">
              <span>{products.length} produits</span>
              <span>{orders.length} commandes</span>
              <span>{pendingOrders} en attente</span>
              <span>${totalRevenue} de volume</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <form action={purgeCancelledOrders}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55 transition hover:border-white/25 hover:text-white"
              >
                Purger annulees
              </button>
            </form>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 font-display text-sm uppercase tracking-[0.22em] text-black transition hover:bg-[#f2dfff]"
              >
                Deconnexion
              </button>
            </form>
          </div>
        </header>

        {searchParams?.saved || searchParams?.updated || searchParams?.purged ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
            Mise a jour enregistree.
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-rose-100">
            Une action a echoue. Verifie les champs puis recommence.
          </div>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase tracking-[0.08em]">Produits</h2>
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/40">Visibles sur la boutique</span>
            </div>

            <div className="space-y-4">
              {products.map((product) => (
                <form key={product.id} action={saveProductSettings} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <input type="hidden" name="productId" value={product.id} />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-white/40">Nom</label>
                      <input
                        name="name"
                        defaultValue={product.name}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-white/40">Prix USD</label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.price}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-white/40">Position</label>
                      <input
                        name="position"
                        type="number"
                        min="1"
                        step="1"
                        defaultValue={product.position}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-white/40">Layout</label>
                      <select
                        name="layout"
                        defaultValue={product.layout}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      >
                        <option value="solo">Solo</option>
                        <option value="duo">Duo</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/65">
                      <input type="checkbox" name="active" defaultChecked={product.active} className="h-4 w-4 accent-white" />
                      Actif
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-white/40">Image</label>
                      <input
                        name="image"
                        defaultValue={product.image}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                      />
                    </div>
                    <button
                      type="submit"
                      className="self-end rounded-full bg-white px-4 py-2 font-display text-sm uppercase tracking-[0.22em] text-black transition hover:bg-[#f2dfff]"
                    >
                      Sauver
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase tracking-[0.08em]">Commandes</h2>
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/40">Suivi client</span>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6 text-[11px] uppercase tracking-[0.24em] text-white/40">
                Aucune commande pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-xl uppercase tracking-[0.08em]">{order.id}</h3>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/50">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                          {new Date(order.createdAt).toLocaleString('fr-FR')} • {order.itemCount} article(s) • ${order.total}
                        </p>
                      </div>

                      <form action={setOrderStatus} className="flex flex-wrap items-center gap-3">
                        <input type="hidden" name="orderId" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white outline-none transition focus:border-white/30"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-white px-4 py-2 font-display text-sm uppercase tracking-[0.22em] text-black transition hover:bg-[#f2dfff]"
                        >
                          Mettre a jour
                        </button>
                      </form>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                      <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                        <p className="mb-3 text-[10px] uppercase tracking-[0.26em] text-white/35">Client</p>
                        <div className="space-y-2 text-sm text-white/80">
                          <p>{order.customer.country} ({order.customer.dialCode})</p>
                          <p>{order.customer.phone}</p>
                          <p>{order.customer.address}</p>
                          <p>{order.customer.email || 'Sans email'}</p>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                        <p className="mb-3 text-[10px] uppercase tracking-[0.26em] text-white/35">Panier</p>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.productId}-${item.size}`} className="flex items-center justify-between gap-3 text-sm text-white/80">
                              <div>
                                <p>{item.name}</p>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                                  {item.size} • {item.quantity}x
                                </p>
                              </div>
                              <span>${item.lineTotal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
