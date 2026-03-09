'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';
import { ProductCard } from '@/components/product-card';
import { type OrderRecord, type ProductRecord, type ProductSize } from '@/lib/products';

type CartItem = {
  productId: string;
  name: string;
  image: string;
  size: ProductSize;
  quantity: number;
  price: number;
};

type StorefrontProps = {
  products: ProductRecord[];
};

type CheckoutFormState = {
  countryCode: string;
  phoneNational: string;
  address: string;
  email: string;
};

type OrderConfirmation = {
  id: string;
  createdAt: string;
  itemCount: number;
  total: number;
  country: string;
  phone: string;
  email: string | null;
};

type Row = {
  type: 'solo' | 'duo';
  products: ProductRecord[];
};

const CART_STORAGE_KEY = 'atelophobia-cart';

const drawerBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};

const drawerPanelVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.22, ease: 'easeIn' } }
};

function buildRows(products: ProductRecord[]): Row[] {
  const sorted = [...products].sort((left, right) => left.position - right.position);
  const rows: Row[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const product = sorted[index];

    if (product.layout === 'solo') {
      rows.push({ type: 'solo', products: [product] });
      continue;
    }

    const pair = [product];
    const next = sorted[index + 1];

    if (next && next.layout === 'duo') {
      pair.push(next);
      index += 1;
      rows.push({ type: 'duo', products: pair });
      continue;
    }

    rows.push({ type: 'solo', products: pair });
  }

  return rows;
}

export function AtelophobiaHome({ products }: StorefrontProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [addedStates, setAddedStates] = useState<Record<string, boolean>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    countryCode: DEFAULT_COUNTRY.code,
    phoneNational: '',
    address: '',
    email: ''
  });
  const [cartReady, setCartReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);

  const rows = useMemo(() => buildRows(products), [products]);
  const selectedCountry = COUNTRIES.find((country) => country.code === checkoutForm.countryCode) || DEFAULT_COUNTRY;
  const bagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const confirmationDate = orderConfirmation
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(orderConfirmation.createdAt))
    : null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        setCartReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setCartItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartReady) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, cartReady]);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', checkoutOpen);

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [checkoutOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveProductId(null);
        setCheckoutOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('[data-product-card]')) {
        setActiveProductId(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, []);

  const handleActivate = (id: string) => {
    setActiveProductId(id);
  };

  const handleAddToBag = (product: ProductRecord, selectedSize: ProductSize) => {
    setActiveProductId(product.id);

    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id && item.size === selectedSize);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          image: product.image,
          size: selectedSize,
          quantity: 1,
          price: product.price
        }
      ];
    });

    setAddedStates((current) => ({ ...current, [product.id]: true }));
    setCheckoutError(null);
    setOrderConfirmation(null);

    window.setTimeout(() => {
      setAddedStates((current) => ({ ...current, [product.id]: false }));
    }, 1500);
  };

  const updateItemQuantity = (productId: string, size: ProductSize, quantity: number) => {
    setOrderConfirmation(null);

    if (quantity <= 0) {
      setCartItems((current) => current.filter((item) => !(item.productId === productId && item.size === size)));
      return;
    }

    setCartItems((current) =>
      current.map((item) =>
        item.productId === productId && item.size === size ? { ...item, quantity } : item
      )
    );
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setCheckoutError('Ajoute au moins un article avant de commander.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);
    setOrderConfirmation(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: checkoutForm,
          items: cartItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity
          }))
        })
      });

      const payload = (await response.json()) as { error?: string; order?: OrderRecord };

      if (!response.ok) {
        throw new Error(payload.error || 'Commande impossible.');
      }

      setCartItems([]);
      setCheckoutForm({
        countryCode: DEFAULT_COUNTRY.code,
        phoneNational: '',
        address: '',
        email: ''
      });
      setOrderConfirmation({
        id: payload.order?.id || 'ORD-PENDING',
        createdAt: payload.order?.createdAt || new Date().toISOString(),
        itemCount: payload.order?.itemCount || bagCount,
        total: payload.order?.total || totalAmount,
        country: payload.order?.customer.country || selectedCountry.name,
        phone: payload.order?.customer.phone || `${selectedCountry.dialCode} ${checkoutForm.phoneNational}`,
        email: payload.order?.customer.email || checkoutForm.email || null
      });
      setCheckoutOpen(true);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Commande impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header>
        <button type="button" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ATELOPHOBIA
        </button>

        <div className="header-right">
          <button type="button" className="cart-btn" onClick={() => setCheckoutOpen(true)}>
            BAG ({bagCount})
          </button>
        </div>
      </header>

      <main className="feed">
        {rows.map((row, index) => (
          <div key={`${row.type}-${index}`} className={row.type === 'solo' ? 'row-solo' : 'row-duo'}>
            {row.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                touched={activeProductId === product.id}
                added={Boolean(addedStates[product.id])}
                onActivate={handleActivate}
                onAddToBag={handleAddToBag}
              />
            ))}
          </div>
        ))}
      </main>

      <footer>
        <span>© 2025 Atelophobia</span>
        <span>US — USD $</span>
      </footer>

      <AnimatePresence>
        {checkoutOpen ? (
          <motion.div
            className="checkout-shell"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerBackdropVariants}
          >
            <button type="button" className="checkout-backdrop" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout" />

            <motion.aside className="checkout-panel" variants={drawerPanelVariants}>
              <div className="checkout-topbar">
                <div>
                  <p className="checkout-kicker">{orderConfirmation ? 'Confirmation' : 'Commande'}</p>
                  <h2 className="checkout-title">{orderConfirmation ? 'Commande recue' : 'Ton bag'}</h2>
                </div>
                <button
                  type="button"
                  className="checkout-close"
                  onClick={() => {
                    setCheckoutOpen(false);
                    if (orderConfirmation) {
                      setOrderConfirmation(null);
                    }
                  }}
                >
                  Close
                </button>
              </div>

              <div className="checkout-content">
                {orderConfirmation ? (
                  <section className="checkout-confirmation">
                    <div className="checkout-confirmation-hero">
                      <p className="checkout-confirmation-kicker">Commande validee</p>
                      <h3 className="checkout-confirmation-title">Ta commande a bien ete recue.</h3>
                      <p className="checkout-confirmation-copy">
                        Merci. La commande est en attente de verification et l&apos;equipe peut te contacter rapidement
                        pour la suite.
                      </p>
                    </div>

                    <div className="checkout-confirmation-id">
                      <span>Numero de commande</span>
                      <strong>{orderConfirmation.id}</strong>
                    </div>

                    <div className="checkout-confirmation-grid">
                      <div className="checkout-confirmation-card">
                        <span>Articles</span>
                        <strong>{orderConfirmation.itemCount}</strong>
                      </div>
                      <div className="checkout-confirmation-card">
                        <span>Total</span>
                        <strong>${orderConfirmation.total}</strong>
                      </div>
                    </div>

                    <div className="checkout-confirmation-card checkout-confirmation-details">
                      <span>Livraison</span>
                      <strong>{orderConfirmation.country}</strong>
                      <p>{orderConfirmation.phone}</p>
                      {orderConfirmation.email ? <p>{orderConfirmation.email}</p> : <p>Mail non renseigne</p>}
                      {confirmationDate ? <p>{confirmationDate}</p> : null}
                    </div>

                    <p className="checkout-confirmation-note">
                      Garde ce numero. Il permet d&apos;identifier la commande si tu reviens vers la boutique.
                    </p>

                    <div className="checkout-confirmation-actions">
                      <button
                        type="button"
                        className="checkout-secondary"
                        onClick={() => {
                          setOrderConfirmation(null);
                          setCheckoutOpen(false);
                        }}
                      >
                        Retour a la boutique
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <section className="checkout-section">
                      <div className="checkout-section-head">
                        <span>Articles</span>
                        <span>{bagCount}</span>
                      </div>

                      {cartItems.length === 0 ? (
                        <div className="checkout-empty">Le bag est vide.</div>
                      ) : (
                        <div className="checkout-items">
                          {cartItems.map((item) => (
                            <div key={`${item.productId}-${item.size}`} className="checkout-item">
                              <div>
                                <p className="checkout-item-name">{item.name}</p>
                                <p className="checkout-item-meta">
                                  {item.size} • ${item.price}
                                </p>
                              </div>
                              <div className="checkout-item-side">
                                <div className="checkout-qty">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(item.productId, item.size, item.quantity - 1)}
                                  >
                                    -
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(item.productId, item.size, item.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                                <strong>${item.quantity * item.price}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="checkout-section">
                      <div className="checkout-section-head">
                        <span>Infos client</span>
                        <span>${totalAmount}</span>
                      </div>

                      <form className="checkout-form" onSubmit={submitOrder}>
                        <label>
                          <span>Pays</span>
                          <select
                            value={checkoutForm.countryCode}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({ ...current, countryCode: event.target.value }))
                            }
                          >
                            {COUNTRIES.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Numero</span>
                          <div className="phone-field">
                            <div className="phone-code">{selectedCountry.dialCode}</div>
                            <input
                              value={checkoutForm.phoneNational}
                              onChange={(event) =>
                                setCheckoutForm((current) => ({ ...current, phoneNational: event.target.value }))
                              }
                              placeholder="77 000 00 00"
                              inputMode="tel"
                            />
                          </div>
                        </label>

                        <label>
                          <span>Adresse de livraison</span>
                          <textarea
                            value={checkoutForm.address}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({ ...current, address: event.target.value }))
                            }
                            rows={4}
                            placeholder="Ville, quartier, repere, rue, appartement..."
                          />
                        </label>

                        <label>
                          <span>Mail (optionnel)</span>
                          <input
                            type="email"
                            value={checkoutForm.email}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({ ...current, email: event.target.value }))
                            }
                            placeholder="toi@email.com"
                          />
                        </label>

                        {checkoutError ? <p className="checkout-error">{checkoutError}</p> : null}

                        <button type="submit" className="checkout-submit" disabled={isSubmitting || cartItems.length === 0}>
                          {isSubmitting ? 'Envoi...' : 'Envoyer la commande'}
                        </button>
                      </form>
                    </section>
                  </>
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
