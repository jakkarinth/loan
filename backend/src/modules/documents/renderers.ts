import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { DocumentPayload } from "./document-data.js";

const THAI_FONT_CANDIDATES = [
  "/mnt/c/Windows/Fonts/tahoma.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
];

const THAI_BOLD_FONT_CANDIDATES = [
  "/mnt/c/Windows/Fonts/tahomabd.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
];

function firstExisting(paths: string[]) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

export function renderPdf(res: Response, payload: DocumentPayload, fileName: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}.pdf"`);

  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: payload.title,
      Author: "RMUTI Surin Loan Management System"
    }
  });

  const font = firstExisting(THAI_FONT_CANDIDATES);
  const boldFont = firstExisting(THAI_BOLD_FONT_CANDIDATES);
  const hasThaiFont = Boolean(font);
  const hasThaiBoldFont = Boolean(boldFont);
  if (font) doc.registerFont("Thai", font);
  if (boldFont) doc.registerFont("ThaiBold", boldFont);

  doc.pipe(res);
  if (font) doc.font("Thai");

  drawHeader(doc, payload, hasThaiFont, hasThaiBoldFont);
  drawBody(doc, payload, hasThaiFont, hasThaiBoldFont);
  drawSignatures(doc, payload);
  doc.end();
}

export function renderWord(res: Response, payload: DocumentPayload, fileName: string) {
  res.setHeader("Content-Type", "application/msword; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}.doc"`);
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Tahoma, 'Noto Sans Thai', sans-serif; font-size: 16px; line-height: 1.55; color: #111827; }
    .page { width: 720px; margin: 0 auto; }
    h1 { text-align: center; font-size: 24px; margin: 0 0 6px; }
    h2 { text-align: center; font-size: 18px; margin: 0 0 24px; font-weight: normal; }
    .meta { margin-bottom: 20px; }
    .section { margin: 18px 0; }
    .section-title { font-weight: bold; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #d1d5db; padding: 7px 9px; vertical-align: top; }
    td:first-child { width: 32%; background: #f3f4f6; font-weight: bold; }
    p { margin: 10px 0; }
    .signatures { margin-top: 42px; display: table; width: 100%; }
    .signature { display: table-cell; text-align: center; padding: 0 8px; }
    .line { border-bottom: 1px solid #111827; height: 42px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(payload.title)}</h1>
    <h2>${escapeHtml(payload.subtitle)}</h2>
    <div class="meta">
      ${payload.documentNo ? `<div><strong>เลขที่เอกสาร:</strong> ${escapeHtml(payload.documentNo)}</div>` : ""}
      ${payload.date ? `<div><strong>วันที่:</strong> ${escapeHtml(payload.date)}</div>` : ""}
    </div>
    ${payload.sections
      .map(
        (section) => `<div class="section">
          <div class="section-title">${escapeHtml(section.title)}</div>
          <table>${section.rows
            .map(
              ([label, value]) =>
                `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
            )
            .join("")}</table>
        </div>`
      )
      .join("")}
    ${(payload.body ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    <div class="signatures">
      ${(payload.signatureLabels ?? [])
        .map(
          (label) => `<div class="signature"><div class="line"></div><div>${escapeHtml(label)}</div></div>`
        )
        .join("")}
    </div>
  </div>
</body>
</html>`);
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  payload: DocumentPayload,
  hasThaiFont: boolean,
  hasThaiBoldFont: boolean
) {
  if (hasThaiBoldFont) doc.font("ThaiBold");
  doc.fontSize(20).text(payload.title, { align: "center" });
  if (hasThaiFont) doc.font("Thai");
  doc.moveDown(0.2);
  doc.fontSize(14).text(payload.subtitle, { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(11);
  if (payload.documentNo) doc.text(`เลขที่เอกสาร: ${payload.documentNo}`);
  if (payload.date) doc.text(`วันที่: ${payload.date}`);
  doc.moveDown(0.6);
}

function drawBody(
  doc: PDFKit.PDFDocument,
  payload: DocumentPayload,
  hasThaiFont: boolean,
  hasThaiBoldFont: boolean
) {
  for (const section of payload.sections) {
    ensureSpace(doc, 90);
    if (hasThaiBoldFont) doc.font("ThaiBold");
    doc.fontSize(13).text(section.title);
    if (hasThaiFont) doc.font("Thai");
    doc.moveDown(0.3);
    for (const [label, value] of section.rows) {
      ensureSpace(doc, 36);
      const y = doc.y;
      doc.fontSize(10.5).text(label, 54, y, { width: 150 });
      doc.text(value, 210, y, { width: 330 });
      doc.moveDown(0.7);
    }
    doc.moveDown(0.5);
  }

  for (const paragraph of payload.body ?? []) {
    ensureSpace(doc, 70);
    doc.fontSize(11).text(paragraph, { align: "left", paragraphGap: 8 });
  }
}

function drawSignatures(doc: PDFKit.PDFDocument, payload: DocumentPayload) {
  const labels = payload.signatureLabels ?? [];
  if (labels.length === 0) return;
  ensureSpace(doc, 120);
  doc.moveDown(2);
  const startX = 54;
  const width = 150;
  const gap = labels.length > 1 ? (486 - width * labels.length) / (labels.length - 1) : 0;
  const y = doc.y + 28;
  labels.forEach((label, index) => {
    const x = startX + index * (width + gap);
    doc.moveTo(x, y).lineTo(x + width, y).stroke();
    doc.fontSize(10).text(label, x, y + 8, { width, align: "center" });
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, minHeight: number) {
  if (doc.y + minHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function safeFileName(prefix: string, documentNo?: string) {
  const normalized = (documentNo ?? "document").replace(/[^a-zA-Z0-9ก-๙_-]+/g, "-");
  return path.posix.basename(`${prefix}-${normalized}`);
}
