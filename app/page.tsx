import { AtelophobiaHome } from '@/components/atelophobia-home';
import { getActiveProducts } from '@/lib/store';

export const revalidate = 3600;

export default async function Page() {
  const products = await getActiveProducts();

  return <AtelophobiaHome products={products} />;
}
