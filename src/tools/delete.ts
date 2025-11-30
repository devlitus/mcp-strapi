import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const deleteToolSchema = z.object({
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "articles")'),
  documentId: z
    .string()
    .describe(
      "⚠️ REQUIRED: documentId de la entrada a ELIMINAR. Este es el identificador único (string) de la entrada específica que quieres borrar en Strapi v5. ⚠️ ANTES DE USAR ESTA HERRAMIENTA, SIEMPRE pregunta al usuario que confirme el documentId que desea eliminar. Ejemplo: 'abc123xyz', '2f8a9c1b'"
    ),
});

export const deleteToolHandler = async (params: {
  contentType: string;
  documentId: string;
}) => {
  try {
    console.error(
      `[DELETE TOOL] Deleting entry ${params.documentId} from ${params.contentType}`
    );

    const result = await strapiClient.delete({
      contentType: params.contentType,
      documentId: params.documentId,
    });

    const output = {
      success: true,
      deletedDocumentId: params.documentId,
      deletedData: result.data,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully deleted entry ${params.documentId} from ${
            params.contentType
          }\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[DELETE TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error deleting entry ${params.documentId} from ${params.contentType}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
