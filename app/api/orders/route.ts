import { NextResponse } from 'next/server';

import { COUNTRIES } from '@/lib/countries';
import { SIZES } from '@/lib/products';
import { createOrder } from '@/lib/store';

const sizeSet = new Set(SIZES);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      customer?: {
        countryCode?: string;
        address?: string;
        phoneNational?: string;
        email?: string;
      };
      items?: Array<{
        productId?: string;
        size?: string;
        quantity?: number;
      }>;
    };

    if (!payload.customer || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'Commande incomplete.' }, { status: 400 });
    }

    const country = COUNTRIES.find((entry) => entry.code === payload.customer?.countryCode);

    if (!country) {
      return NextResponse.json({ error: 'Pays invalide.' }, { status: 400 });
    }

    const address = payload.customer.address?.trim() || '';
    const phoneNational = (payload.customer.phoneNational || '').replace(/[^0-9 ]/g, '').trim();
    const email = payload.customer.email?.trim() || null;

    if (!address || !phoneNational) {
      return NextResponse.json({ error: 'Adresse et numero obligatoires.' }, { status: 400 });
    }

    const items = payload.items.map((item) => {
      if (!item.productId || !item.size || !sizeSet.has(item.size as (typeof SIZES)[number])) {
        throw new Error('Produit invalide.');
      }

      return {
        productId: item.productId,
        size: item.size as (typeof SIZES)[number],
        quantity: Number.isFinite(item.quantity) ? Math.max(1, Math.floor(item.quantity as number)) : 1
      };
    });

    const order = await createOrder({
      customer: {
        country: country.name,
        countryCode: country.code,
        dialCode: country.dialCode,
        phoneNational,
        phone: `${country.dialCode} ${phoneNational}`,
        address,
        email
      },
      items
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de creer la commande.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
