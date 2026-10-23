/**
 * Formats integer paise into a localized Indian Rupee currency string.
 * Example: 250000 paise -> "₹2,50,000"
 */
export function formatPaiseToInr(paise: number, includeSymbol = true): string {
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Converts a rupee amount (string or number) into integer paise.
 * Never allows fractional paise.
 */
export function rupeesToPaise(rupees: number | string): number {
  const cleanNumber = typeof rupees === 'string' ? parseFloat(rupees.replace(/[^\d.]/g, '')) : rupees;
  if (isNaN(cleanNumber)) return 0;
  return Math.round(cleanNumber * 100);
}

/**
 * Formats user typing into Indian number style as they type.
 */
export function formatLiveRupeeInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const num = parseInt(digitsOnly, 10);
  return new Intl.NumberFormat('en-IN').format(num);
}
