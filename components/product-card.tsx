'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { memo, useState } from 'react';

import { type ProductRecord, type ProductSize } from '@/lib/products';

type ProductCardProps = {
  product: ProductRecord;
  touched: boolean;
  added: boolean;
  onActivate: (id: string) => void;
  onAddToBag: (product: ProductRecord, size: ProductSize) => void;
};

export const ProductCard = memo(function ProductCard({
  product,
  touched,
  added,
  onActivate,
  onAddToBag
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const isReady = Boolean(selectedSize);
  const isRemoteImage = /^https?:\/\//i.test(product.image);

  const selectSize = (size: ProductSize) => {
    setSelectedSize(size);
  };

  const addToBag = () => {
    if (!selectedSize) {
      return;
    }

    onAddToBag(product, selectedSize);
  };

  return (
    <div
      className={clsx('item group', touched && 'touched')}
      data-product-card
      data-product-id={product.id}
      onClick={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest('button')) {
          return;
        }

        onActivate(product.id);
      }}
    >
      <Image
        src={product.image}
        alt={product.name}
        width={product.width}
        height={product.height}
        sizes={product.layout === 'solo' ? '(max-width: 600px) 100vw, 62vw' : '(max-width: 600px) 100vw, 50vw'}
        priority={product.position === 1}
        unoptimized={isRemoteImage}
        className="product-image"
      />

      <div className="price-badge">${product.price}</div>

      <div className="overlay">
        <div className="ov-name">{product.name}</div>
        <div className="ov-price">${product.price}</div>

        <div className="ov-sizes">
          {product.availableSizes.map((size) => (
            <button
              key={size}
              type="button"
              className={clsx('size-opt', selectedSize === size && 'selected')}
              onTouchEnd={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectSize(size);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectSize(size);
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={clsx('ov-btn', isReady && 'ready', added && 'added')}
          onTouchEnd={(event) => {
            event.preventDefault();
            event.stopPropagation();
            addToBag();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            addToBag();
          }}
        >
          {added ? 'Added' : isReady ? 'Add to bag' : 'Select a size'}
        </button>
      </div>
    </div>
  );
});
