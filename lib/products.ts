export type ProductLayout = 'solo' | 'duo';
export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';

export type ProductRecord = {
  id: string;
  name: string;
  price: number;
  image: string;
  width: number;
  height: number;
  layout: ProductLayout;
  availableSizes: ProductSize[];
  active: boolean;
  position: number;
};

export type OrderItemRecord = {
  productId: string;
  name: string;
  image: string;
  size: ProductSize;
  quantity: number;
  price: number;
  lineTotal: number;
};

export type CustomerRecord = {
  country: string;
  countryCode: string;
  dialCode: string;
  phoneNational: string;
  phone: string;
  address: string;
  email: string | null;
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItemRecord[];
  itemCount: number;
  total: number;
  customer: CustomerRecord;
};

export const SIZES: ProductSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

export function isProductSize(value: string): value is ProductSize {
  return SIZES.includes(value as ProductSize);
}

export function sanitizeProductSizes(values: string[]) {
  return SIZES.filter((size) => values.includes(size));
}

export function withDefaultProductSizes(values?: string[] | null) {
  const sanitized = sanitizeProductSizes(values || []);
  return sanitized.length > 0 ? sanitized : [...SIZES];
}

export const PRODUCT_SEED: ProductRecord[] = [
  {
    id: 'pinkao-sleeve',
    name: 'Da Pinkao Sleeve',
    price: 17,
    image: '/products/product-1.jpeg',
    width: 880,
    height: 1168,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 1
  },
  {
    id: 'mekao-pull-b',
    name: 'Da Mekao Pull B',
    price: 21,
    image: '/products/product-2.jpeg',
    width: 1024,
    height: 1024,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 3
  },
  {
    id: 'mekao-pull-a',
    name: 'Da Mekao Pull A',
    price: 21,
    image: '/products/product-4.jpeg',
    width: 928,
    height: 1120,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 4
  },
  {
    id: 'phobias-jeans',
    name: "Da Phobia's Jeans",
    price: 26,
    image: '/products/product-3.jpeg',
    width: 875,
    height: 1313,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 5
  },
  {
    id: 'blackies-sleeve',
    name: "D Blackie's Sleeve",
    price: 17,
    image: '/products/product-5.jpeg',
    width: 875,
    height: 1313,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 2
  },
  {
    id: 'phobias-jeans-black',
    name: "Da Phobia's Jeans Black",
    price: 26,
    image: '/products/product-6.jpeg',
    width: 875,
    height: 1313,
    layout: 'duo',
    availableSizes: [...SIZES],
    active: true,
    position: 6
  }
];
