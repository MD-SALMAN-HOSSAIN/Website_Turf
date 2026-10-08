import { SignJWT } from "jose";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

interface SheetBooking {
  code: string;
  pitchId: string;
  pitchName?: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  teamName: string | null;
  paymentMethod: string;
  status: string;
  amount: number;
  manual: boolean;
  createdAt: Date | string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

interface ServiceAccountEnv {
  email: string;
  privateKey: string;
  sheetId: string;
}

function readEnv(): ServiceAccountEnv | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!email || !privateKey || !sheetId) return null;
  return { email, privateKey, sheetId };
}

export function isSheetsConfigured() {
  return readEnv() !== null;
}

export function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

async function getAccessToken(env: ServiceAccountEnv) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const signed = await new SignJWT({ scope: "https://www.googleapis.com/auth/spreadsheets" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(env.email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPrivateKey(normalizePrivateKey(env.privateKey)));

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signed,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function importPrivateKey(privateKey: string) {
  const { createPrivateKey } = await import("node:crypto");
  return createPrivateKey(privateKey);
}

function bookingRow(booking: SheetBooking) {
  return [
    booking.code,
    booking.pitchName ?? booking.pitchId,
    booking.date,
    booking.startTime,
    booking.endTime,
    booking.name,
    booking.phone,
    booking.teamName ?? "",
    booking.paymentMethod,
    booking.status,
    String(booking.amount),
    booking.manual ? "Manual" : "Online",
    new Date(booking.createdAt).toISOString(),
  ];
}

export const SHEET_HEADERS = [
  "Code",
  "Pitch",
  "Date",
  "Start",
  "End",
  "Name",
  "Phone",
  "Team",
  "Payment",
  "Status",
  "Amount (BDT)",
  "Source",
  "Created At",
];

export async function ensureHeaderRow(sheetId: string, token: string) {
  const url = `${SHEETS_BASE}/${sheetId}/values/A1:M1?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.ok) {
    const data = (await response.json()) as { values?: unknown[][] };
    if (Array.isArray(data.values) && data.values.length > 0) return;
  }
  await fetch(`${SHEETS_BASE}/${sheetId}/values/A1:M1?valueInputOption=USER_ENTERED&valueInputOption=RAW`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [SHEET_HEADERS] }),
    cache: "no-store",
  });
}

export async function appendBookings(bookings: SheetBooking[]) {
  const env = readEnv();
  if (!env) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  const token = await getAccessToken(env);
  await ensureHeaderRow(env.sheetId, token);

  const url = `${SHEETS_BASE}/${env.sheetId}/values/Sheet1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: bookings.map(bookingRow) }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sheets append failed (${response.status}): ${body}`);
  }

  return { appended: bookings.length };
}

export function toCsv(bookings: SheetBooking[]) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [SHEET_HEADERS.join(",")];
  for (const booking of bookings) {
    lines.push(bookingRow(booking).map(escape).join(","));
  }
  return lines.join("\n");
}
