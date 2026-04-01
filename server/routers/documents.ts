import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createDocument, deleteDocument, getDocumentsByItem, getItemById } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export const documentsRouter = router({
  getByItem: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .query(({ input }) => getDocumentsByItem(input.itemId)),

  upload: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        docType: z.enum(["certificate_of_authenticity", "appraisal", "provenance", "other"]),
        fileName: z.string().min(1).max(255),
        fileBase64: z.string(), // base64-encoded file
        mimeType: z.string().default("application/pdf"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getItemById(input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      if (item.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can upload documents" });
      }

      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `documents/${input.itemId}/${randomSuffix()}-${input.fileName}`;

      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      await createDocument({
        itemId: input.itemId,
        uploaderId: ctx.user.id,
        docType: input.docType,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
      });

      return { success: true, url };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteDocument(input.id, ctx.user.id);
      return { success: true };
    }),
});
