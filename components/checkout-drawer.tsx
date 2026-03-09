'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { COUNTRIES, type CountryOption } from '@/lib/countries';
import { type ProductSize } from '@/lib/products';

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  size: ProductSize;
  quantity: number;
  price: number;
};

export type CheckoutFormState = {
  countryCode: string;
  phoneNational: string;
  address: string;
  email: string;
};

export type OrderConfirmation = {
  id: string;
  createdAt: string;
  itemCount: number;
  total: number;
  country: string;
  phone: string;
  email: string | null;
};

type CheckoutDrawerProps = {
  open: boolean;
  bagCount: number;
  cartItems: CartItem[];
  checkoutForm: CheckoutFormState;
  checkoutError: string | null;
  confirmationDate: string | null;
  isSubmitting: boolean;
  orderConfirmation: OrderConfirmation | null;
  selectedCountry: CountryOption;
  totalAmount: number;
  onCheckoutFormChange: (field: keyof CheckoutFormState, value: string) => void;
  onClearConfirmation: () => void;
  onClose: () => void;
  onSubmitOrder: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onUpdateItemQuantity: (productId: string, size: ProductSize, quantity: number) => void;
};

const drawerBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }
};

const drawerPanelVariants: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.24, ease: 'easeOut' } },
  exit: { opacity: 0, x: 18, transition: { duration: 0.16, ease: 'easeIn' } }
};

export function CheckoutDrawer({
  open,
  bagCount,
  cartItems,
  checkoutForm,
  checkoutError,
  confirmationDate,
  isSubmitting,
  orderConfirmation,
  selectedCountry,
  totalAmount,
  onCheckoutFormChange,
  onClearConfirmation,
  onClose,
  onSubmitOrder,
  onUpdateItemQuantity
}: CheckoutDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="checkout-shell"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={drawerBackdropVariants}
        >
          <button type="button" className="checkout-backdrop" onClick={onClose} aria-label="Close checkout" />

          <motion.aside className="checkout-panel" variants={drawerPanelVariants}>
            <div className="checkout-topbar">
              <div>
                <p className="checkout-kicker">{orderConfirmation ? 'Confirmation' : 'Commande'}</p>
                <h2 className="checkout-title">{orderConfirmation ? 'Commande recue' : 'Ton bag'}</h2>
              </div>
              <button type="button" className="checkout-close" onClick={onClose}>
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
                        onClearConfirmation();
                        onClose();
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
                                  onClick={() => onUpdateItemQuantity(item.productId, item.size, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateItemQuantity(item.productId, item.size, item.quantity + 1)}
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

                    <form className="checkout-form" onSubmit={onSubmitOrder}>
                      <label>
                        <span>Pays</span>
                        <select
                          value={checkoutForm.countryCode}
                          onChange={(event) => onCheckoutFormChange('countryCode', event.target.value)}
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
                            onChange={(event) => onCheckoutFormChange('phoneNational', event.target.value)}
                            placeholder="77 000 00 00"
                            inputMode="tel"
                          />
                        </div>
                      </label>

                      <label>
                        <span>Adresse de livraison</span>
                        <textarea
                          value={checkoutForm.address}
                          onChange={(event) => onCheckoutFormChange('address', event.target.value)}
                          rows={4}
                          placeholder="Ville, quartier, repere, rue, appartement..."
                        />
                      </label>

                      <label>
                        <span>Mail (optionnel)</span>
                        <input
                          type="email"
                          value={checkoutForm.email}
                          onChange={(event) => onCheckoutFormChange('email', event.target.value)}
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
  );
}
