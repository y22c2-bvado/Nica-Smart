
const STORAGE_KEY = "nica_smart_promo_cart";

export function getPromoCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function savePromoCart(items) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );
}

export function addPromoProduct(product) {
  const items = getPromoCart();

  const price = Number(product.price);
  const original = Number(
    product.original_price ??
    product.originalPrice ??
    price
  );

  if (
    product.id == null ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return false;
  }

  const existing = items.find(
    (item) => String(item.id) === String(product.id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      image:
        product.image_url ||
        product.image ||
        product.images?.[0]?.url ||
        null,
      price,
      original:
        Number.isFinite(original) && original > price
          ? original
          : price,
      quantity: 1,
    });
  }

  savePromoCart(items);
  return true;
}

export function clearPromoCart() {
  localStorage.removeItem(STORAGE_KEY);
}
