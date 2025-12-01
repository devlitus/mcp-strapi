import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";
import {
  validateDocumentLanguage,
  detectMixedLanguages,
  extractTextFields,
  formatValidationResults,
} from "../services/i18n-validator.js";

export const updateToolSchema = z.object({
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "articles")'),
  documentId: z
    .string()
    .describe(
      "⚠️ REQUIRED: documentId de la entrada a actualizar. Este es el identificador único (string) de la entrada específica que quieres modificar en Strapi v5. SIEMPRE pregunta al usuario por este ID antes de actualizar. Ejemplo: 'abc123xyz', '2f8a9c1b'"
    ),
  data: z
    .record(z.any())
    .describe(
      "Datos a actualizar (actualización parcial). Solo incluye los campos que quieres cambiar"
    ),
  populate: z.array(z.string()).optional().describe("Relaciones a poblar"),
  locale: z
    .string()
    .optional()
    .describe(
      'Locale para actualizar una localización específica en i18n (ej: "en", "es", "ca")'
    ),
  validateBeforeUpdate: z
    .boolean()
    .optional()
    .default(true)
    .describe("Validar idioma antes de actualizar (default: true)"),
  strictMode: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Modo estricto: falla si hay inconsistencias de idioma (default: false)"
    ),
});

export const updateToolHandler = async (params: {
  contentType: string;
  documentId: string;
  data: Record<string, any>;
  populate?: string[];
  locale?: string;
  validateBeforeUpdate?: boolean;
  strictMode?: boolean;
}) => {
  try {
    console.error(
      `[UPDATE TOOL] Updating entry ${params.documentId} in ${
        params.contentType
      }${params.locale ? ` (locale: ${params.locale})` : ""}`
    );

    // Pre-update validation if requested and locale is specified
    const warnings: string[] = [];

    if (params.validateBeforeUpdate !== false && params.locale) {
      console.error(`[UPDATE TOOL] Validating data before update...`);

      // Extract text fields from the data to be updated
      const textFields = extractTextFields(params.data);

      for (const [fieldName, fieldValue] of Object.entries(textFields)) {
        // Check for mixed languages
        const mixedCheck = detectMixedLanguages(fieldValue);

        if (mixedCheck.isMixed && mixedCheck.warning) {
          const warning = `Campo "${fieldName}": ${mixedCheck.warning}`;
          warnings.push(warning);
          console.error(`[UPDATE TOOL WARNING] ${warning}`);
        }
      }

      // In strict mode, fail if there are warnings
      if (params.strictMode && warnings.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `❌ Error en modo estricto: No se puede actualizar debido a inconsistencias de idioma:\n\n${warnings.join(
                "\n"
              )}\n\nPor favor, corrige el contenido antes de actualizar.`,
            },
          ],
          isError: true,
        };
      }
    }

    const result = await strapiClient.update({
      contentType: params.contentType,
      documentId: params.documentId,
      data: params.data,
      populate: params.populate,
      locale: params.locale,
    });

    // Validate the updated document if requested
    let validationMessage = "";
    let validationResults = null;

    if (params.validateBeforeUpdate !== false && params.locale) {
      validationResults = validateDocumentLanguage(result.data, params.locale, {
        checkMixedLanguages: true,
        minimumConfidence: 30,
        strictMode: false, // Don't fail after successful update
      });

      if (!validationResults.isValid) {
        validationMessage = formatValidationResults(validationResults);
      }
    }

    // Include pre-update warnings if any
    let warningsMessage = "";
    if (warnings.length > 0) {
      warningsMessage = `\n\n⚠️ Advertencias pre-actualización:\n${warnings.join(
        "\n"
      )}`;
    }

    const output = {
      success: true,
      data: result.data,
      documentId: result.data.documentId,
      validation: validationResults,
      preUpdateWarnings: warnings.length > 0 ? warnings : undefined,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully updated entry ${params.documentId} in ${
            params.contentType
          }${
            params.locale ? ` (locale: ${params.locale})` : ""
          }${warningsMessage}${validationMessage}\n\n${JSON.stringify(
            output,
            null,
            2
          )}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[UPDATE TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error updating entry ${params.documentId} in ${params.contentType}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
