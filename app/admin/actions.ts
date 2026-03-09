'use server';

import path from 'path';

import { put } from '@vercel/blob';
import { imageSize } from 'image-size';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  clearAdminSession,
  createAdminSession,
  requireAdminAuth,
  validateAdminCode
} from '@/lib/admin-auth';
import {
  getOrders,
  getProducts,
  getSiteSettings,
  saveProducts,
  saveSiteSettings,
  updateOrderStatus
} from '@/lib/store';
import { type OrderStatus, type ProductLayout, type ProductRecord } from '@/lib/products';

function slugifyProductId(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function parseInteger(value: FormDataEntryValue | null, minimum = 1) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const normalized = Math.floor(parsed);
  return normalized >= minimum ? normalized : null;
}

function parsePrice(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.round(parsed));
}

function parseLayout(value: FormDataEntryValue | null): ProductLayout {
  return value === 'solo' ? 'solo' : 'duo';
}

function getSafeExtension(fileName: string) {
  const extension = path.extname(fileName || '').toLowerCase();
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(extension) ? extension : '.jpg';
}

function buildProductImageRoute(pathname: string) {
  return `/api/product-images?path=${encodeURIComponent(pathname)}`;
}

async function resolveProductImage({
  productId,
  imageInput,
  imageFile,
  widthInput,
  heightInput,
  fallbackImage,
  fallbackWidth,
  fallbackHeight
}: {
  productId: string;
  imageInput: string;
  imageFile: File | null;
  widthInput: number | null;
  heightInput: number | null;
  fallbackImage?: string;
  fallbackWidth?: number;
  fallbackHeight?: number;
}) {
  let image = imageInput || fallbackImage || '';
  let width = widthInput || fallbackWidth || 0;
  let height = heightInput || fallbackHeight || 0;

  if (imageFile && imageFile.size > 0) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      redirect('/admin?error=upload');
    }

    const bytes = new Uint8Array(await imageFile.arrayBuffer());
    const dimensions = imageSize(bytes);

    if (!dimensions.width || !dimensions.height) {
      redirect('/admin?error=image');
    }

    const pathname = `products/${productId}-${Date.now()}${getSafeExtension(imageFile.name)}`;
    const uploaded = await put(pathname, imageFile, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: imageFile.type || undefined
    });

    image = buildProductImageRoute(uploaded.pathname);
    width = dimensions.width;
    height = dimensions.height;
  }

  if (!image || width <= 0 || height <= 0) {
    redirect('/admin?error=image');
  }

  return {
    image,
    width: Math.floor(width),
    height: Math.floor(height)
  };
}

async function saveProductCollection(products: ProductRecord[]) {
  await saveProducts(products);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function loginAdmin(formData: FormData) {
  const code = String(formData.get('code') || '');

  if (!(await validateAdminCode(code))) {
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

  const productId = String(formData.get('productId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const imageInput = String(formData.get('image') || '').trim();
  const imageFile = formData.get('imageFile') as File | null;
  const price = parsePrice(formData.get('price'));
  const position = parseInteger(formData.get('position'));
  const widthInput = parseInteger(formData.get('width'));
  const heightInput = parseInteger(formData.get('height'));
  const layout = parseLayout(formData.get('layout'));
  const active = formData.get('active') === 'on';

  const products = await getProducts();
  const existingProduct = products.find((product) => product.id === productId);

  if (!existingProduct || !productId || !name || price === null || position === null) {
    redirect('/admin?error=product');
  }

  const { image, width, height } = await resolveProductImage({
    productId,
    imageInput,
    imageFile,
    widthInput,
    heightInput,
    fallbackImage: existingProduct.image,
    fallbackWidth: existingProduct.width,
    fallbackHeight: existingProduct.height
  });

  const nextProducts = products.map((product) =>
    product.id === productId
      ? {
          ...product,
          name,
          image,
          width,
          height,
          price,
          position,
          layout,
          active
        }
      : product
  );

  await saveProductCollection(nextProducts);
  redirect('/admin?saved=1');
}

export async function createProduct(formData: FormData) {
  requireAdminAuth();

  const products = await getProducts();
  const rawCode = String(formData.get('productCode') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const price = parsePrice(formData.get('price'));
  const position = parseInteger(formData.get('position')) || products.length + 1;
  const widthInput = parseInteger(formData.get('width'));
  const heightInput = parseInteger(formData.get('height'));
  const layout = parseLayout(formData.get('layout'));
  const active = formData.get('active') === 'on';
  const imageInput = String(formData.get('image') || '').trim();
  const imageFile = formData.get('imageFile') as File | null;
  const productId = slugifyProductId(rawCode || name);

  if (!productId || !name || price === null) {
    redirect('/admin?error=product');
  }

  if (products.some((product) => product.id === productId)) {
    redirect('/admin?error=duplicate-product');
  }

  const { image, width, height } = await resolveProductImage({
    productId,
    imageInput,
    imageFile,
    widthInput,
    heightInput
  });

  const nextProducts = [
    ...products,
    {
      id: productId,
      name,
      image,
      width,
      height,
      price,
      position,
      layout,
      active
    }
  ];

  await saveProductCollection(nextProducts);
  redirect('/admin?created=1');
}

export async function updateAdminCode(formData: FormData) {
  requireAdminAuth();

  const adminCode = String(formData.get('adminCode') || '').trim();
  const confirmAdminCode = String(formData.get('confirmAdminCode') || '').trim();

  if (!/^\d{4,12}$/.test(adminCode)) {
    redirect('/admin?error=invalid-code');
  }

  if (adminCode !== confirmAdminCode) {
    redirect('/admin?error=code-match');
  }

  const settings = await getSiteSettings();
  await saveSiteSettings({
    ...settings,
    adminCode,
    updatedAt: new Date().toISOString()
  });

  revalidatePath('/admin');
  revalidatePath('/admin/login');
  redirect('/admin?coded=1');
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
