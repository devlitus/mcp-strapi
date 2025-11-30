import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const getSchemaToolSchema = z.object({
  contentType: z
    .string()
    .describe('UID completo del content type (ej: "api::product.product")'),
});

export const getSchemaToolHandler = async (params: { contentType: string }) => {
  try {
    console.error(
      `[GET SCHEMA TOOL] Fetching schema for ${params.contentType}`
    );

    const result = await strapiClient.getContentType(params.contentType);

    if (!result.data || !result.data.schema) {
      throw new Error("Schema not found");
    }

    const schema = result.data.schema;
    const attributes = schema.attributes || {};

    // Extraer campos requeridos y sus detalles
    const requiredFields: any[] = [];
    const optionalFields: any[] = [];

    Object.entries(attributes).forEach(
      ([fieldName, fieldConfig]: [string, any]) => {
        const fieldInfo = {
          name: fieldName,
          type: fieldConfig.type,
          required: fieldConfig.required || false,
          unique: fieldConfig.unique || false,
          default: fieldConfig.default,
          min: fieldConfig.min,
          max: fieldConfig.max,
          enum: fieldConfig.enum,
          relation: fieldConfig.relation,
          target: fieldConfig.target,
        };

        // Limpiar campos undefined
        Object.keys(fieldInfo).forEach((key) => {
          if (fieldInfo[key] === undefined) {
            delete fieldInfo[key];
          }
        });

        if (fieldConfig.required) {
          requiredFields.push(fieldInfo);
        } else {
          optionalFields.push(fieldInfo);
        }
      }
    );

    const output = {
      success: true,
      contentType: params.contentType,
      displayName: schema.displayName,
      pluralName: schema.pluralName,
      singularName: schema.singularName,
      description: schema.description,
      requiredFields,
      optionalFields,
      totalFields: Object.keys(attributes).length,
    };

    const formattedText = `Schema de ${schema.displayName} (${
      params.contentType
    })

📋 Información General:
- Nombre plural: ${schema.pluralName}
- Nombre singular: ${schema.singularName}
- Descripción: ${schema.description || "N/A"}
- Total de campos: ${Object.keys(attributes).length}

✅ Campos Requeridos (${requiredFields.length}):
${requiredFields
  .map((f) => {
    let detail = `- ${f.name} (${f.type})`;
    if (f.enum) detail += ` - valores: ${f.enum.join(", ")}`;
    if (f.min !== undefined) detail += ` - min: ${f.min}`;
    if (f.max !== undefined) detail += ` - max: ${f.max}`;
    if (f.relation) detail += ` - relación ${f.relation} con ${f.target}`;
    return detail;
  })
  .join("\n")}

⚪ Campos Opcionales (${optionalFields.length}):
${optionalFields
  .map((f) => {
    let detail = `- ${f.name} (${f.type})`;
    if (f.default !== undefined) detail += ` - default: ${f.default}`;
    if (f.enum) detail += ` - valores: ${f.enum.join(", ")}`;
    if (f.relation) detail += ` - relación ${f.relation} con ${f.target}`;
    return detail;
  })
  .join("\n")}

💡 Para crear una entrada, usa los campos requeridos marcados arriba.`;

    return {
      content: [
        {
          type: "text" as const,
          text: formattedText,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[GET SCHEMA TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error fetching schema for ${params.contentType}: ${errorMessage}

💡 Asegúrate de usar el UID completo, por ejemplo: "api::product.product"
   Para ver todos los UIDs disponibles, usa strapi-list-content-types`,
        },
      ],
      isError: true,
    };
  }
};
