'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  clearAdminSession,
  createAdminSession,
  requireAdminAuth,
  validateAdminCode
} from '@/lib/admin-auth';
import { getOrders, getProducts, saveProducts, updateOrderStatus } from '@/lib/store';
import { type OrderStatus, type ProductLayout } from '@/lib/products';

export async function loginAdmin(formData: FormData) {
  const code = String(formData.get('code') || '');

  if (!validateAdminCode(code)) {
    redirect('/admin/login?error=1');
  }

  createAdminSession();
  redirect('/admin');
}

export async function logoutAdmin() {
  requireAdminAuth();
  clearAdminSession();
  redirect('/admin/login');
}

export async function saveProductSettings(formData: FormData) {
  requireAdminAuth();

  const productId = String(formData.get('productId') || '');
  const name = String(formData.get('name') || '').trim();
  const image = String(formData.get('image') || '').trim();
  const price = Number(formData.get('price') || 0);
  const position = Number(formData.get('position') || 0);
  const layout = String(formData.get('layout') || 'duo') as ProductLayout;
  const active = formData.get('active') === 'on';

  if (!productId || !name || !image || Number.isNaN(price) || Number.isNaN(position)) {
    redirect('/admin?error=product');
  }

  const products = await getProducts();
  const nextProducts = products.map((product) =>
    product.id === productId
      ? {
          ...product,
          name,
          image,
          price: Math.max(0, price),
          position: Math.max(1, Math.floor(position)),
          layout,
          active
        }
      : product
  );

  await saveProducts(nextProducts);
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin?saved=1');
}

export async function setOrderStatus(formData: FormData) {
  requireAdminAuth();

  const orderId = String(formData.get('orderId') || '');
  const status = String(formData.get('status') || 'pending') as OrderStatus;

  if (!orderId) {
    redirect('/admin?error=order');
  }

  await updateOrderStatus(orderId, status);
  revalidatePath('/admin');
  redirect('/admin?updated=1');
}

export async function purgeCancelledOrders() {
  requireAdminAuth();

  const orders = await getOrders();
  const filtered = orders.filter((order) => order.status !== 'cancelled');

  if (filtered.length !== orders.length) {
    const { saveOrders } = await import('@/lib/store');
    await saveOrders(filtered);
    revalidatePath('/admin');
  }

  redirect('/admin?purged=1');
}
