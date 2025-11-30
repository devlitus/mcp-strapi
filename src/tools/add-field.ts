import { z } from 'zod';
import { strapiClient } from '../services/strapi-client.js';

export const addFieldToolSchema = {
  contentType: z.string().describe('UID del content type (ej: "api::product.product")'),
  fieldName: z.string().describe('Nombre del campo a añadir (ej: "title", "price")'),
  fieldType: z.enum([
    'string',
    'text',
    'richtext',
    'email',
    'password',
    'integer',
    'biginteger',
    'float',
    'decimal',
    'date',
    'time',
    'datetime',
    'timestamp',
    'boolean',
    'enumeration',
    'json',
    'uid',
  ]).describe('Tipo del campo'),
  options: z.record(z.any()).optional().describe('Opciones adicionales del campo (required, unique, minLength, maxLength, etc.)'),
};

export const addFieldToolHandler = async (params: {
  contentType: string;
  fieldName: string;
  fieldType: string;
  options?: Record<string, any>;
}) => {
  try {
    console.error(`[ADD FIELD TOOL] Adding field ${params.fieldName} to ${params.contentType}`);

    const result = await strapiClient.addFieldToContentType({
      contentType: params.contentType,
      fieldName: params.fieldName,
      fieldType: params.fieldType,
      options: params.options,
    });

    const output = {
      success: true,
      message: `Field '${params.fieldName}' added successfully to ${params.contentType}`,
      fieldName: params.fieldName,
      fieldType: params.fieldType,
      options: params.options,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully added field '${params.fieldName}' (${params.fieldType}) to ${params.contentType}\n\n${JSON.stringify(output, null, 2)}\n\nNOTE: You may need to restart Strapi for changes to take effect.`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ADD FIELD TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Error adding field to ${params.contentType}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
