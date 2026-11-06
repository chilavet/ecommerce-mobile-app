export const CURRENCY_SYMBOL = '₦';

/**
 * Formats an amount into Nigerian Naira (₦) with thousand separators.
 * e.g. 350000 -> "₦350,000"
 * e.g. 2500.5 -> "₦2,500.50" (if showDecimals is true)
 */
export const formatNaira = (amount: number, showDecimals: boolean = false): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₦0';
  }
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
};

export default formatNaira;

