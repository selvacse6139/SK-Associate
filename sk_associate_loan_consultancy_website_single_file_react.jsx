// api/lead.js
// Vercel serverless function to accept multipart/form-data leads
// Tries SMTP email -> Airtable -> Google Sheets (in that order)
// Uses environment variables (see README below)

export const config = { api: { bodyParser: false } };

import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";
import Airtable from "airtable";
import { google } from "googleapis";

async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function sendBySMTP(fields, files) {
  // Required env vars for SMTP:
  // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (from address)
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP not configured");

  const transporter = nodemailer.createTransport({
    host: host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || false, // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const to = process.env.LEAD_RECEIVER_EMAIL || process.env.SMTP_USER;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const subject = `${process.env.BRAND_NAME || "Website"} — New lead from site`;
  const textParts = [];
  for (const k of Object.keys(fields)) {
    textParts.push(`${k}: ${fields[k]}`);
  }
  const text = textParts.join("\n");

  const attachments = [];
  if (files && files.document) {
    const f = files.document;
    // formidable gives either object or array; handle both
    const fileObj = Array.isArray(f) ? f[0] : f;
    if (fileObj && fileObj.path) {
      attachments.push({
        filename: fileObj.name || "attachment",
        path: fileObj.path,
      });
    }
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    attachments,
  });

  return { provider: "smtp", messageId: info.messageId };
}

async function saveToAirtable(fields, files) {
  // Requires: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("Airtable not configured");
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "Leads";

  const base = new Airtable({ apiKey: key }).base(baseId);

  // Airtable attachments need public URL. Here we just store file name in a field.
  const record = {
    "Name": fields.name || "",
    "Phone": fields.phone || "",
    "Email": fields.email || "",
    "Loan Type": fields.loanType || fields.loan_type || "",
    "Amount": fields.amount || "",
    "Message": fields.message || "",
    "Source": fields.source || "Website",
    "Notes": `Raw fields: ${JSON.stringify(fields)}`,
  };

  // If a file exists, add its filename to a column called AttachmentName
  if (files && files.document) {
    const f = Array.isArray(files.document) ? files.document[0] : files.document;
    if (f && f.name) {
      record.AttachmentName = f.name;
    }
  }

  const created = await base(tableName).create([{ fields: record }]);
  return { provider: "airtable", id: created[0].id };
}

async function appendToGoogleSheet(fields, files) {
  // Requires: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) throw new Error("Google Sheets not configured");

  // private key may be stored with escaped newlines; replace literal \n sequences
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth: jwtClient });

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

  const now = new Date().toISOString();
  const row = [
    now,
    fields.name || "",
    fields.phone || "",
    fields.email || "",
    fields.loanType || fields.loan_type || "",
    fields.amount || "",
    fields.message || "",
    (files && files.document) ? (Array.isArray(files.document) ? files.document[0].name : files.document.name) : "",
  ];

  await jwtClient.authorize();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });

  return { provider: "google_sheets" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);

    // Try SMTP first
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const smtpRes = await sendBySMTP(fields, files);
        return res.status(200).json({ ok: true, via: smtpRes });
      }
    } catch (smtpErr) {
      console.error("SMTP send failed:", smtpErr);
      // continue to next provider
    }

    // Try Airtable next
    try {
      if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
        const airtableRes = await saveToAirtable(fields, files);
        return res.status(200).json({ ok: true, via: airtableRes });
      }
    } catch (airErr) {
      console.error("Airtable save failed:", airErr);
    }

    // Fallback: Google Sheets
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID) {
        const sheetRes = await appendToGoogleSheet(fields, files);
        return res.status(200).json({ ok: true, via: sheetRes });
      }
    } catch (gsErr) {
      console.error("Google Sheets append failed:", gsErr);
    }

    // If we reach here, no provider configured
    return res.status(500).json({ error: "No delivery provider configured or all providers failed" });
  } catch (err) {
    console.error("Parse/handler error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
