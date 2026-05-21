/**
 * Normalizes phone numbers for Meta WhatsApp Cloud API.
 * Expects digits only with country code, e.g. 59899123456 (no +, spaces, or 00 prefix).
 */
export function normalizeWhatsAppPhone(
  phone: string,
  defaultCountryCode = "598"
): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Already looks like international format (UY mobile ~11 digits, AR ~12–13)
  if (digits.length >= 11) {
    return digits;
  }

  // Local UY mobile: 09X XXX XXX → 9XXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 8 || digits.length === 9) {
    if (digits.startsWith("9") || digits.startsWith("4")) {
      return `${defaultCountryCode}${digits}`;
    }
  }

  return digits;
}
