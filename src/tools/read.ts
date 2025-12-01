import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";
import {
  validateDocumentLanguage,
  formatValidationResults,
} from "../services/i18n-validator.js";

export const readToolSchema = z.object({
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "articles")'),
  documentId: z
    .string()
    .describe(
      "documentId de la entrada (recomendado en Strapi v5 - string único)"
    ),
  fields: z
    .array(z.string())
    .optional()
    .describe("Campos específicos a retornar"),
  populate: z.array(z.string()).optional().describe("Relaciones a poblar"),
  locale: z
    .string()
    .optional()
    .describe('Locale para i18n (ej: "en", "es", "ca")'),
  validateLanguage: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Validar que el contenido esté en el idioma correcto (default: true)"
    ),
  strictMode: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Modo estricto: falla si no hay traducción propia y se devuelve fallback (default: false)"
    ),
});

export const readToolHandler = async (params: {
  contentType: string;
  documentId: string;
  fields?: string[];
  populate?: string[];
  locale?: string;
  validateLanguage?: boolean;
  strictMode?: boolean;
}) => {
  try {
    console.error(
      `[READ TOOL] Reading entry ${params.documentId} from ${params.contentType}`
    );
    if (params.locale) {
      console.error(`[READ TOOL] Using locale: ${params.locale}`);
    }

    const result = await strapiClient.read({
      contentType: params.contentType,
      documentId: params.documentId,
      fields: params.fields,
      populate: params.populate,
      locale: params.locale,
    });

    // Perform language validation if requested and locale is specified
    let validationMessage = "";
    let validationResults = null;

    if (params.validateLanguage !== false && params.locale) {
      validationResults = validateDocumentLanguage(result.data, params.locale, {
        checkMixedLanguages: true,
        minimumConfidence: 30,
        strictMode: params.strictMode || false,
      });

      // In strict mode, fail if validation fails
      if (params.strictMode && !validationResults.isValid) {
        return {
          content: [
            {
              type: "text" as const,
              text: `❌ Error en modo estricto al leer ${
                params.documentId
              } de ${params.contentType}:${formatValidationResults(
                validationResults
              )}`,
            },
          ],
          isError: true,
        };
      }

      validationMessage = formatValidationResults(validationResults);
    }

    const output = {
      success: true,
      data: result.data,
      validation: validationResults,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully read entry ${params.documentId} from ${
            params.contentType
          }${
            params.locale ? ` (locale: ${params.locale})` : ""
          }${validationMessage}\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[READ TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error reading entry ${params.documentId} from ${params.contentType}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
