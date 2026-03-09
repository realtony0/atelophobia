import { unstable_noStore as noStore } from 'next/cache';

import { AtelophobiaHome } from '@/components/atelophobia-home';
import { getActiveProducts } from '@/lib/store';

export default async function Page() {
  noStore();

  const products = await getActiveProducts();

  return <AtelophobiaHome products={products} />;
}
