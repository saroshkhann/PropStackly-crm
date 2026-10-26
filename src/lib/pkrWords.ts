/**
 * Pakistani Rupee (PKR) Numbers to Words Converter
 * Converts amounts in Arab, Crore, Lakh, Thousand into English and Urdu words
 * specifically for Pakistani Real Estate Legal Agreements (Iqrarnama, Receipts, Tax Challans).
 */

const urduDigits = ["صفر", "ایک", "دو", "تین", "چار", "پانچ", "چھ", "سات", "آٹھ", "نو"];
const urduTeens = ["دس", "گیارہ", "بارہ", "تیرہ", "چودہ", "پندرہ", "سولہ", "سترہ", "اٹھارہ", "انیس"];
const urduTens = ["", "دس", "بیس", "تیس", "چالیس", "پچاس", "ساٹھ", "ستر", "اسی", "نوے"];

const englishOnes = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const englishTeens = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const englishTens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsEnglish(n: number): string {
  if (n === 0) return "";
  if (n < 10) return englishOnes[n];
  if (n < 20) return englishTeens[n - 10];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one > 0 ? `${englishTens[ten]} ${englishOnes[one]}` : englishTens[ten];
}

function threeDigitsEnglish(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (hundred > 0) {
    str += `${englishOnes[hundred]} Hundred`;
    if (rest > 0) str += " and ";
  }
  if (rest > 0) {
    str += twoDigitsEnglish(rest);
  }
  return str;
}

export function pkrToEnglishWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return "Zero Rupees Only";

  let n = Math.floor(amount);
  const parts: string[] = [];

  const arab = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;

  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;

  const lakh = Math.floor(n / 100_000);
  n %= 100_000;

  const thousand = Math.floor(n / 1_000);
  n %= 1_000;

  const remainder = n;

  if (arab > 0) parts.push(`${twoDigitsEnglish(arab)} Arab`);
  if (crore > 0) parts.push(`${twoDigitsEnglish(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigitsEnglish(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigitsEnglish(thousand)} Thousand`);
  if (remainder > 0) parts.push(threeDigitsEnglish(remainder));

  return `${parts.join(" ")} Rupees Only`;
}

// Urdu conversion helpers
const urduNumbersUnder100: { [key: number]: string } = {
  0: "صفر", 1: "ایک", 2: "دو", 3: "تین", 4: "چار", 5: "پانچ", 6: "چھ", 7: "سات", 8: "آٹھ", 9: "نو", 10: "دس",
  11: "گیارہ", 12: "بارہ", 13: "تیرہ", 14: "چودہ", 15: "پندرہ", 16: "سولہ", 17: "سترہ", 18: "اٹھارہ", 19: "انیس", 20: "بیس",
  21: "اکیس", 22: "بائیس", 23: "تیئیس", 24: "چوبیس", 25: "پچیس", 26: "چھبیس", 27: "ستائیس", 28: "اٹھائیس", 29: "انتیس", 30: "تیس",
  31: "اکتیس", 32: "بتیس", 33: "تینتیس", 34: "چونتیس", 35: "پینتیس", 36: "چھتیس", 37: "سینتیس", 38: "اڑتیس", 39: "انتالیس", 40: "چالیس",
  41: "اکتالیس", 42: "بیالیس", 43: "تینتالیس", 44: "چوالیس", 45: "پینتالیس", 46: "چھیاسٹھ", 47: "سینتالیس", 48: "اڑتالیس", 49: "انچاس", 50: "پچاس",
  51: "اکاون", 52: "باون", 53: "ترپن", 54: "چون", 55: "پچپن", 56: "چھپن", 57: "ستاون", 58: "اٹھاون", 59: "انسٹھ", 60: "ساٹھ",
  61: "اکسٹھ", 62: "باسٹھ", 63: "تریسٹھ", 64: "چوسٹھ", 65: "پینسٹھ", 66: "چھیاسٹھ", 67: "سڑسٹھ", 68: "اڑسٹھ", 69: "انہتر", 70: "ستر",
  71: "اکہتر", 72: "بہتر", 73: "تہتر", 74: "چوہتر", 75: "پچہتر", 76: "چھہتر", 77: "ستتر", 78: "اٹھتر", 79: "اناسی", 80: "اسی",
  81: "اکیاسی", 82: "بیاسی", 83: "تراسی", 84: "چوراسی", 85: "پچاسی", 86: "چھیاسی", 87: "ستاسی", 88: "اٹھاسی", 89: "نواسی", 90: "نوے",
  91: "اکیانوے", 92: "بانوے", 93: "ترانوے", 94: "چورانوے", 95: "پچانوے", 96: "چھیانوے", 97: "ستانوے", 98: "اٹھانوے", 99: "نناوے"
};

function twoDigitsUrdu(n: number): string {
  return urduNumbersUnder100[n] || String(n);
}

export function pkrToUrduWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return "صفر روپے فقط";

  let n = Math.floor(amount);
  const parts: string[] = [];

  const arab = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;

  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;

  const lakh = Math.floor(n / 100_000);
  n %= 100_000;

  const thousand = Math.floor(n / 1_000);
  n %= 1_000;

  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  if (arab > 0) parts.push(`${twoDigitsUrdu(arab)} ارب`);
  if (crore > 0) parts.push(`${twoDigitsUrdu(crore)} کروڑ`);
  if (lakh > 0) parts.push(`${twoDigitsUrdu(lakh)} لاکھ`);
  if (thousand > 0) parts.push(`${twoDigitsUrdu(thousand)} ہزار`);
  if (hundred > 0) parts.push(`${twoDigitsUrdu(hundred)} سو`);
  if (remainder > 0) parts.push(twoDigitsUrdu(remainder));

  return `${parts.join(" ")} روپے فقط`;
}
