import { Router } from "express";
import {
  getExtensionDocumentPayload,
  getLoanDocumentPayload,
  getNoticeDocumentPayload,
  getPaymentDocumentPayload,
  getSummaryReportPayload
} from "./document-data.js";
import { renderPdf, renderWord, safeFileName } from "./renderers.js";
import { asyncHandler, parseId } from "../../lib/http.js";

export const documentsRouter = Router();

documentsRouter.get(
  "/loans/:id/contract.pdf",
  asyncHandler(async (req, res) => {
    const payload = await getLoanDocumentPayload(parseId(req.params.id));
    renderPdf(res, payload, safeFileName("loan-contract", payload.documentNo));
  })
);

documentsRouter.get(
  "/loans/:id/contract.doc",
  asyncHandler(async (req, res) => {
    const payload = await getLoanDocumentPayload(parseId(req.params.id));
    renderWord(res, payload, safeFileName("loan-contract", payload.documentNo));
  })
);

documentsRouter.get(
  "/loans/:id/payment.pdf",
  asyncHandler(async (req, res) => {
    const payload = await getPaymentDocumentPayload(parseId(req.params.id));
    renderPdf(res, payload, safeFileName("payment-detail", payload.documentNo));
  })
);

documentsRouter.get(
  "/loans/:id/payment.doc",
  asyncHandler(async (req, res) => {
    const payload = await getPaymentDocumentPayload(parseId(req.params.id));
    renderWord(res, payload, safeFileName("payment-detail", payload.documentNo));
  })
);

documentsRouter.get(
  "/extensions/:id/memo.pdf",
  asyncHandler(async (req, res) => {
    const payload = await getExtensionDocumentPayload(parseId(req.params.id));
    renderPdf(res, payload, safeFileName("extension-memo", payload.documentNo));
  })
);

documentsRouter.get(
  "/extensions/:id/memo.doc",
  asyncHandler(async (req, res) => {
    const payload = await getExtensionDocumentPayload(parseId(req.params.id));
    renderWord(res, payload, safeFileName("extension-memo", payload.documentNo));
  })
);

documentsRouter.get(
  "/notices/:id/notice.pdf",
  asyncHandler(async (req, res) => {
    const payload = await getNoticeDocumentPayload(parseId(req.params.id));
    renderPdf(res, payload, safeFileName("debt-notice", payload.documentNo));
  })
);

documentsRouter.get(
  "/notices/:id/notice.doc",
  asyncHandler(async (req, res) => {
    const payload = await getNoticeDocumentPayload(parseId(req.params.id));
    renderWord(res, payload, safeFileName("debt-notice", payload.documentNo));
  })
);

documentsRouter.get(
  "/reports/summary.pdf",
  asyncHandler(async (_req, res) => {
    const payload = await getSummaryReportPayload();
    renderPdf(res, payload, "loan-summary-report");
  })
);

documentsRouter.get(
  "/reports/summary.doc",
  asyncHandler(async (_req, res) => {
    const payload = await getSummaryReportPayload();
    renderWord(res, payload, "loan-summary-report");
  })
);

