'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';
import {
  type CartItem,
  type CheckoutFormState,
  type OrderConfirmation
} from '@/components/checkout-drawer';
import { ProductCard } from '@/components/product-card';
import { type OrderRecord, type ProductRecord, type ProductSize } from '@/lib/products';

type StorefrontProps = {
  products: ProductRecord[];
};

type Row = {
  type: 'solo' | 'duo';
  products: ProductRecord[];
};

const CART_STORAGE_KEY = 'atelophobia-cart';
const LazyCheckoutDrawer = dynamic(() => import('@/components/checkout-drawer').then((mod) => mod.CheckoutDrawer), {
  ssr: false
});

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
  const router = useRouter();
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
  const hiddenAdminTapCount = useRef(0);
  const hiddenAdminTapTimer = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (hiddenAdminTapTimer.current) {
        window.clearTimeout(hiddenAdminTapTimer.current);
      }
    };
  }, []);

  const handleActivate = useCallback((id: string) => {
    setActiveProductId(id);
  }, []);

  const handleAddToBag = useCallback((product: ProductRecord, selectedSize: ProductSize) => {
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
  }, []);

  const updateItemQuantity = useCallback((productId: string, size: ProductSize, quantity: number) => {
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
  }, []);

  const handleCheckoutFormChange = useCallback((field: keyof CheckoutFormState, value: string) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
  }, []);

  const clearConfirmation = useCallback(() => {
    setOrderConfirmation(null);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
    setOrderConfirmation(null);
  }, []);

  const handleLogoClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    hiddenAdminTapCount.current += 1;

    if (hiddenAdminTapTimer.current) {
      window.clearTimeout(hiddenAdminTapTimer.current);
    }

    if (hiddenAdminTapCount.current >= 9) {
      hiddenAdminTapCount.current = 0;
      router.push('/admin/login');
      return;
    }

    hiddenAdminTapTimer.current = window.setTimeout(() => {
      hiddenAdminTapCount.current = 0;
      hiddenAdminTapTimer.current = null;
    }, 1800);
  }, [router]);

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
        <button type="button" className="logo" onClick={handleLogoClick}>
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

      {checkoutOpen ? (
        <LazyCheckoutDrawer
          open={checkoutOpen}
          bagCount={bagCount}
          cartItems={cartItems}
          checkoutForm={checkoutForm}
          checkoutError={checkoutError}
          confirmationDate={confirmationDate}
          isSubmitting={isSubmitting}
          orderConfirmation={orderConfirmation}
          selectedCountry={selectedCountry}
          totalAmount={totalAmount}
          onCheckoutFormChange={handleCheckoutFormChange}
          onClearConfirmation={clearConfirmation}
          onClose={closeCheckout}
          onSubmitOrder={submitOrder}
          onUpdateItemQuantity={updateItemQuantity}
        />
      ) : null}
    </>
  );
}
