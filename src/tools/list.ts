import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";
import { analyzeLocalizationStatus } from "../services/i18n-validator.js";

export const listToolSchema = {
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "articles")'),
  filters: z.record(z.any()).optional().describe("Filtros para la consulta"),
  sort: z
    .array(z.string())
    .optional()
    .describe('Campos para ordenar (ej: ["createdAt:desc"])'),
  pagination: z
    .object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
    })
    .optional()
    .describe("Configuración de paginación"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Campos específicos a retornar"),
  populate: z.array(z.string()).optional().describe("Relaciones a poblar"),
  locale: z
    .string()
    .optional()
    .describe('Locale para i18n (ej: "en", "es", "ca")'),
  showLocalizationSummary: z
    .boolean()
    .optional()
    .default(true)
    .describe("Mostrar resumen de locales disponibles para cada entrada (default: true)"),
};

export const listToolHandler = async (params: {
  contentType: string;
  filters?: Record<string, any>;
  sort?: string[];
  pagination?: { page?: number; pageSize?: number };
  fields?: string[];
  populate?: string[];
  locale?: string;
  showLocalizationSummary?: boolean;
}) => {
  try {
    console.error(`[LIST TOOL] Listing entries from ${params.contentType}`);
    if (params.locale) {
      console.error(`[LIST TOOL] Using locale: ${params.locale}`);
    }

    const result = await strapiClient.list({
      contentType: params.contentType,
      filters: params.filters,
      sort: params.sort,
      pagination: params.pagination as
        | { page: number; pageSize: number }
        | undefined,
      fields: params.fields,
      populate: params.populate,
      locale: params.locale,
    });

    // Add localization summary if requested
    let localizationSummary = "";
    const enrichedData = result.data;

    if (params.showLocalizationSummary !== false && result.data.length > 0) {
      const summaryLines: string[] = ["\n\n🌐 Resumen de Localizaciones:"];

      result.data.forEach((item: any, index: number) => {
        const status = analyzeLocalizationStatus(item, params.locale);
        const itemId = item.documentId || item.id || index;

        summaryLines.push(
          `\n📄 Entrada ${itemId}:` +
          `\n   Locale actual: ${status.currentLocale}` +
          `\n   Traducciones disponibles: ${status.availableLocales.join(", ")}` +
          `\n   Traducción propia: ${status.isOwnTranslation ? "✅ Sí" : "⚠️ No (heredada)"}` +
          (status.inheritedFrom ? `\n   ⚠️ Heredado desde: ${status.inheritedFrom}` : "")
        );
      });

      localizationSummary = summaryLines.join("\n");
    }

    const output = {
      success: true,
      data: enrichedData,
      meta: result.meta,
      count: result.data.length,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully listed ${output.count} entries from ${
            params.contentType
          }${
            params.locale ? ` (locale: ${params.locale})` : ""
          }${localizationSummary}\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[LIST TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error listing entries from ${params.contentType}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
