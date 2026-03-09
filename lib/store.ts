import { promises as fs } from 'fs';
import path from 'path';

import { del, get, list, put } from '@vercel/blob';

import {
  PRODUCT_SEED,
  type CustomerRecord,
  type OrderRecord,
  type OrderStatus,
  type ProductRecord,
  type ProductSize
} from '@/lib/products';

const dataDir = path.join(process.cwd(), 'data');
const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');
const settingsFile = path.join(dataDir, 'settings.json');

const PRODUCTS_BLOB_PATH = 'store/products.json';
const ORDERS_BLOB_PREFIX = 'store/orders/';
const SETTINGS_BLOB_PATH = 'store/settings.json';
const BLOB_CACHE_SECONDS = 60;

export type SiteSettings = {
  adminCode: string | null;
  updatedAt: string | null;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  adminCode: null,
  updatedAt: null
};

type CreateOrderInput = {
  customer: CustomerRecord;
  items: Array<{
    productId: string;
    size: ProductSize;
    quantity: number;
  }>;
};

const sortProducts = (products: ProductRecord[]) =>
  [...products].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return left.name.localeCompare(right.name);
  });

const sortOrders = (orders: OrderRecord[]) =>
  [...orders].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

const usesBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const orderBlobPath = (orderId: string) => `${ORDERS_BLOB_PREFIX}${orderId}.json`;

async function ensureFile<T>(filePath: string, fallback: T) {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureFile(filePath, fallback);
  const raw = await fs.readFile(filePath, 'utf8');

  try {
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T) {
  await ensureFile(filePath, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function readJsonIfExists<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readBlobJson<T>(pathname: string) {
  const result = await get(pathname, { access: 'private', useCache: false });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeBlobJson(pathname: string, data: unknown) {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: BLOB_CACHE_SECONDS
  });
}

async function listAllOrderBlobs() {
  const blobs: Array<{ pathname: string }> = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: ORDERS_BLOB_PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs.map((blob) => ({ pathname: blob.pathname })));
    cursor = page.cursor;

    if (!page.hasMore) {
      break;
    }
  } while (cursor);

  return blobs;
}

async function getProductsFromBlob() {
  const existing = await readBlobJson<ProductRecord[]>(PRODUCTS_BLOB_PATH);

  if (existing) {
    return sortProducts(existing);
  }

  const seed = await readJsonIfExists<ProductRecord[]>(productsFile, PRODUCT_SEED);
  await writeBlobJson(PRODUCTS_BLOB_PATH, sortProducts(seed));
  return sortProducts(seed);
}

async function saveProductsToBlob(products: ProductRecord[]) {
  await writeBlobJson(PRODUCTS_BLOB_PATH, sortProducts(products));
}

async function getOrdersFromBlob() {
  const blobs = await listAllOrderBlobs();

  if (blobs.length === 0) {
    const localOrders = await readJsonIfExists<OrderRecord[]>(ordersFile, []);

    if (localOrders.length > 0) {
      await saveOrdersToBlob(localOrders);
      return sortOrders(localOrders);
    }

    return [];
  }

  const orders = await Promise.all(
    blobs.map(async (blob) => {
      const order = await readBlobJson<OrderRecord>(blob.pathname);
      return order;
    })
  );

  return sortOrders(orders.filter((order): order is OrderRecord => Boolean(order)));
}

async function saveOrdersToBlob(orders: OrderRecord[]) {
  const sortedOrders = sortOrders(orders);
  const existingBlobs = await listAllOrderBlobs();
  const nextPathnames = new Set(sortedOrders.map((order) => orderBlobPath(order.id)));
  const stalePathnames = existingBlobs
    .map((blob) => blob.pathname)
    .filter((pathname) => !nextPathnames.has(pathname));

  await Promise.all(sortedOrders.map((order) => writeBlobJson(orderBlobPath(order.id), order)));

  if (stalePathnames.length > 0) {
    await del(stalePathnames);
  }
}

async function createOrderInBlob(order: OrderRecord) {
  await put(orderBlobPath(order.id), JSON.stringify(order, null, 2), {
    access: 'private',
    allowOverwrite: false,
    contentType: 'application/json',
    cacheControlMaxAge: BLOB_CACHE_SECONDS
  });
}

async function updateOrderStatusInBlob(orderId: string, status: OrderStatus) {
  const pathname = orderBlobPath(orderId);
  const order = await readBlobJson<OrderRecord>(pathname);

  if (!order) {
    return;
  }

  await writeBlobJson(pathname, { ...order, status });
}

async function getSettingsFromBlob() {
  const existing = await readBlobJson<SiteSettings>(SETTINGS_BLOB_PATH);

  if (existing) {
    return { ...DEFAULT_SITE_SETTINGS, ...existing };
  }

  const localSettings = await readJsonIfExists<SiteSettings>(settingsFile, DEFAULT_SITE_SETTINGS);
  const normalized = { ...DEFAULT_SITE_SETTINGS, ...localSettings };
  await writeBlobJson(SETTINGS_BLOB_PATH, normalized);
  return normalized;
}

async function saveSettingsToBlob(settings: SiteSettings) {
  await writeBlobJson(SETTINGS_BLOB_PATH, { ...DEFAULT_SITE_SETTINGS, ...settings });
}

export async function getProducts() {
  if (usesBlobStorage()) {
    return getProductsFromBlob();
  }

  const products = await readJson<ProductRecord[]>(productsFile, PRODUCT_SEED);
  return sortProducts(products);
}

export async function getActiveProducts() {
  const products = await getProducts();
  return products.filter((product) => product.active);
}

export async function saveProducts(products: ProductRecord[]) {
  if (usesBlobStorage()) {
    await saveProductsToBlob(products);
    return;
  }

  await writeJson(productsFile, sortProducts(products));
}

export async function getOrders() {
  if (usesBlobStorage()) {
    return getOrdersFromBlob();
  }

  const orders = await readJson<OrderRecord[]>(ordersFile, []);
  return sortOrders(orders);
}

export async function saveOrders(orders: OrderRecord[]) {
  if (usesBlobStorage()) {
    await saveOrdersToBlob(orders);
    return;
  }

  await writeJson(ordersFile, sortOrders(orders));
}

export async function getSiteSettings() {
  if (usesBlobStorage()) {
    return getSettingsFromBlob();
  }

  const settings = await readJson<SiteSettings>(settingsFile, DEFAULT_SITE_SETTINGS);
  return { ...DEFAULT_SITE_SETTINGS, ...settings };
}

export async function saveSiteSettings(settings: SiteSettings) {
  const normalized = { ...DEFAULT_SITE_SETTINGS, ...settings };

  if (usesBlobStorage()) {
    await saveSettingsToBlob(normalized);
    return;
  }

  await writeJson(settingsFile, normalized);
}

export async function createOrder(input: CreateOrderInput) {
  const products = await getProducts();

  const items = input.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId && entry.active);

    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }

    const quantity = Math.max(1, Math.floor(item.quantity));
    const lineTotal = product.price * quantity;

    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      size: item.size,
      quantity,
      price: product.price,
      lineTotal
    };
  });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const order: OrderRecord = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    customer: input.customer,
    items,
    itemCount,
    total
  };

  if (usesBlobStorage()) {
    await createOrderInBlob(order);
    return order;
  }

  const orders = await getOrders();
  orders.unshift(order);
  await saveOrders(orders);

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (usesBlobStorage()) {
    await updateOrderStatusInBlob(orderId, status);
    return;
  }

  const orders = await getOrders();
  const nextOrders = orders.map((order) => (order.id === orderId ? { ...order, status } : order));
  await saveOrders(nextOrders);
}
