const SMART_CARD_LENGTH = 10;
const CLASSIC_CARD_LENGTH = 17;

export function normalizeNid(value: string) {
  return value.replace(/[\s-]/g, "");
}

export function validateNid(value: string) {
  const nid = normalizeNid(value);

  if (!/^\d+$/.test(nid)) {
    return { valid: false, message: "NID must contain digits only." };
  }

  if (nid.length !== SMART_CARD_LENGTH && nid.length !== CLASSIC_CARD_LENGTH) {
    return {
      valid: false,
      message: "Enter a 10-digit Smart Card or 17-digit Classic NID.",
    };
  }

  if (/^(\d)\1+$/.test(nid)) {
    return { valid: false, message: "NID looks invalid. Please re-check." };
  }

  return {
    valid: true,
    type: nid.length === SMART_CARD_LENGTH ? "smart" : "classic",
    message: null,
  };
}

export function validatePhone(value: string) {
  const digits = value.replace(/[\s()-]/g, "").replace(/^\+?880/, "0");
  if (!/^01[3-9]\d{8}$/.test(digits)) {
    return { valid: false, message: "Enter a valid Bangladeshi mobile number." };
  }
  return { valid: true, normalized: digits, message: null };
}

export function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "").replace(/^\+?880/, "0");
}
