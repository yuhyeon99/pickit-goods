export function calculateRemainingPurchaseQuantity(
  salesLimit: number,
  soldCount: number,
  availableInventoryCount: number,
) {
  return Math.max(0, Math.min(salesLimit - soldCount, availableInventoryCount));
}
