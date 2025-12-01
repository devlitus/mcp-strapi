import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const createToolSchema = z.object({
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "articles")'),
  data: z.record(z.any()).describe("Datos de la entrada a crear"),
  populate: z.array(z.string()).optional().describe("Relaciones a poblar"),
  locale: z
    .string()
    .optional()
    .describe(
      'Locale para crear la entrada en un idioma específico (ej: "en", "es-ES", "ca")'
    ),
});

export const createToolHandler = async (params: {
  contentType: string;
  data: Record<string, any>;
  populate?: string[];
  locale?: string;
}) => {
  try {
    console.error(
      `[CREATE TOOL] Creating entry in ${params.contentType}${
        params.locale ? ` (locale: ${params.locale})` : ""
      }`
    );

    // Intentar obtener el schema para validar campos requeridos
    let missingRequiredFields: string[] = [];
    let schemaInfo = "";

    try {
      // Convertir nombre plural a UID (ej: "products" -> "api::product.product")
      const singularName = params.contentType.endsWith("s")
        ? params.contentType.slice(0, -1)
        : params.contentType;
      const uid = `api::${singularName}.${singularName}`;

      const schema = await strapiClient.getContentType(uid);

      if (schema.data && schema.data.schema && schema.data.schema.attributes) {
        const attributes = schema.data.schema.attributes;
        const providedFields = Object.keys(params.data);

        // Encontrar campos requeridos que faltan
        Object.entries(attributes).forEach(
          ([fieldName, fieldConfig]: [string, any]) => {
            if (fieldConfig.required && !providedFields.includes(fieldName)) {
              missingRequiredFields.push(fieldName);
            }
          }
        );

        // Si faltan campos requeridos, generar información útil
        if (missingRequiredFields.length > 0) {
          const requiredFieldsInfo = Object.entries(attributes)
            .filter(([_, config]: [string, any]) => config.required)
            .map(([name, config]: [string, any]) => {
              let info = `  - ${name} (${config.type})`;
              if (config.enum) info += ` - valores: ${config.enum.join(", ")}`;
              if (config.min !== undefined) info += ` - min: ${config.min}`;
              if (config.relation) info += ` - relación con ${config.target}`;
              return info;
            })
            .join("\n");

          schemaInfo = `\n\n⚠️ Campos requeridos faltantes: ${missingRequiredFields.join(
            ", "
          )}

📋 Todos los campos requeridos para ${params.contentType}:
${requiredFieldsInfo}

💡 Añade estos campos a tu petición para crear la entrada correctamente.`;

          console.error(
            `[CREATE TOOL WARNING] Missing required fields: ${missingRequiredFields.join(
              ", "
            )}`
          );
        }
      }
    } catch (schemaError) {
      // Si no se puede obtener el schema, continuar sin validación
      console.error(
        `[CREATE TOOL] Could not fetch schema for validation: ${schemaError}`
      );
    }

    // Si hay campos requeridos faltantes, retornar error antes de intentar crear
    if (missingRequiredFields.length > 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se puede crear la entrada en ${params.contentType}${schemaInfo}`,
          },
        ],
        isError: true,
      };
    }

    // Intentar crear la entrada
    const result = await strapiClient.create({
      contentType: params.contentType,
      data: params.data,
      populate: params.populate,
      locale: params.locale,
    });

    const output = {
      success: true,
      data: result.data,
      documentId: result.data.documentId || result.data.id,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully created entry in ${params.contentType}${
            params.locale ? ` (locale: ${params.locale})` : ""
          }\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[CREATE TOOL ERROR] ${errorMessage}`);

    // Mensaje de error mejorado
    let helpfulMessage = errorMessage;

    if (
      errorMessage.includes("errors occurred") ||
      errorMessage.includes("required") ||
      errorMessage.includes("Invalid")
    ) {
      helpfulMessage = `Error de validación en ${
        params.contentType
      }: ${errorMessage}

💡 Posibles causas:
- Faltan campos requeridos
- Valores inválidos en enumeraciones
- Relaciones con documentIds que no existen
- Formato incorrecto de datos

Para ver los campos requeridos exactos, usa: strapi-get-schema con "api::${
        params.contentType.endsWith("s")
          ? params.contentType.slice(0, -1)
          : params.contentType
      }.${
        params.contentType.endsWith("s")
          ? params.contentType.slice(0, -1)
          : params.contentType
      }"`;
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Error creating entry in ${params.contentType}:\n\n${helpfulMessage}`,
        },
      ],
      isError: true,
    };
  }
};
