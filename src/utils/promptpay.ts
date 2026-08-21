// PromptPay EMVCo Standard Payload & QR Code Generator
// Fully compliant with Bank of Thailand (BOT) & National ITMX Standard

/**
 * Calculates CRC16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats an EMVCo TLV (Tag-Length-Value) field
 */
function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Formats a Thai mobile number into PromptPay international standard
 * e.g., "064-3026465" or "0643026465" -> "0066643026465"
 */
export function formatPromptPayTarget(target: string): { type: 'mobile' | 'national_id' | 'ewallet'; value: string } {
  const clean = target.replace(/[^0-9]/g, '');
  if (clean.length === 10 && clean.startsWith('0')) {
    return { type: 'mobile', value: `0066${clean.substring(1)}` };
  } else if (clean.length === 13) {
    return { type: 'national_id', value: clean };
  } else if (clean.length === 15) {
    return { type: 'ewallet', value: clean };
  }
  // Default fallback for mobile
  return { type: 'mobile', value: `0066${clean.replace(/^0/, '')}` };
}

/**
 * Generates the official BOT / EMVCo PromptPay QR Payload string
 */
export function generatePromptPayPayload(target: string, amount?: number | null): string {
  const { type, value } = formatPromptPayTarget(target);

  // Tag 29: Merchant Account Information (PromptPay)
  // Sub-tag 00: AID = A0000007660840111
  const aid = formatField('00', 'A0000007660840111');
  let targetField = '';
  if (type === 'mobile') {
    targetField = formatField('01', value);
  } else if (type === 'national_id') {
    targetField = formatField('02', value);
  } else {
    targetField = formatField('03', value);
  }
  const tag29 = formatField('29', `${aid}${targetField}`);

  // Base EMVCo Fields
  const tag00 = formatField('00', '01'); // Payload Format Indicator
  const tag01 = formatField('01', amount ? '12' : '11'); // Point of Initiation: 12 (Dynamic with amount), 11 (Static)
  const tag53 = formatField('53', '764'); // Transaction Currency (764 = THB)
  const tag58 = formatField('58', 'TH'); // Country Code
  const tag59 = formatField('59', 'MULTIMEDIA STUDIO'); // Merchant Name
  const tag60 = formatField('60', 'BANGKOK'); // Merchant City

  let raw = `${tag00}${tag01}${tag29}${tag53}`;

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    raw += formatField('54', formattedAmount); // Transaction Amount
  }

  raw += `${tag58}${tag59}${tag60}`;

  // Tag 63: CRC16 Checksum
  const rawWithCrcTag = `${raw}6304`;
  const checksum = crc16(rawWithCrcTag);

  return `${rawWithCrcTag}${checksum}`;
}

/**
 * Generates standard QR Code Image URLs with multi-tier failover
 */
export function getPromptPayQrImages(target: string, amount?: number | null): {
  emvPayload: string;
  qrUrl: string;
  backupQrUrl: string;
} {
  const payload = generatePromptPayPayload(target, amount);
  const cleanMobile = target.replace(/[^0-9]/g, '');

  // High-reliability QR generator with exact EMVCo PromptPay Payload
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(payload)}`;
  const backupQrUrl = amount 
    ? `https://promptpay.io/${cleanMobile}/${amount}.png` 
    : `https://promptpay.io/${cleanMobile}.png`;

  return {
    emvPayload: payload,
    qrUrl,
    backupQrUrl,
  };
}
