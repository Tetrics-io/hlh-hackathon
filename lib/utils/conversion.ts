/**
 * E8 Conversion Utilities for Hyperliquid
 * Hyperliquid uses 10^8 scaling for prices and sizes
 */

const SCALE_FACTOR = 10 ** 8

/**
 * Convert a decimal value to E8 format (multiply by 10^8)
 * @param value - Decimal value (e.g., 1.5 HYPE or $50000 price)
 * @returns BigInt in E8 format
 */
export function toE8(value: number | string): bigint {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return BigInt(0)
  
  // Convert to integer by multiplying by 10^8
  return BigInt(Math.floor(num * SCALE_FACTOR))
}

/**
 * Convert E8 format back to decimal (divide by 10^8)
 * @param e8Value - Value in E8 format
 * @returns Decimal number
 */
export function fromE8(e8Value: bigint | string | number): number {
  const bigIntValue = typeof e8Value === 'bigint' ? e8Value : BigInt(e8Value)
  return Number(bigIntValue) / SCALE_FACTOR
}

/**
 * Format E8 value for display with proper decimals
 * @param e8Value - Value in E8 format
 * @param decimals - Number of decimal places to show (default 2)
 * @returns Formatted string
 */
export function formatE8(e8Value: bigint | string | number, decimals: number = 2): string {
  const decimalValue = fromE8(e8Value)
  return decimalValue.toFixed(decimals)
}

/**
 * Validate if a value can be converted to E8
 * @param value - Value to validate
 * @returns true if valid, false otherwise
 */
export function isValidE8Input(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num >= 0 && isFinite(num)
}

/**
 * Convert price in USD to E8 format
 * @param price - Price in USD (e.g., 10.50)
 * @returns Price in E8 format
 */
export function priceToE8(price: number | string): bigint {
  return toE8(price)
}

/**
 * Convert size/quantity to E8 format
 * @param size - Size/quantity (e.g., 1.0 HYPE)
 * @returns Size in E8 format
 */
export function sizeToE8(size: number | string): bigint {
  return toE8(size)
}