const LOCAL_PRODUCT_IMAGE_PATTERN = /^\/products\/(product-\d+)\.(?:jpe?g|png|webp)$/i;

export function getDisplayImageSrc(image: string) {
  const match = image.match(LOCAL_PRODUCT_IMAGE_PATTERN);

  if (!match) {
    return image;
  }

  return `/products/transparent/${match[1]}.png`;
}
