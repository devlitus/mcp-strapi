import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const searchMediaToolSchema = {
  search: z
    .string()
    .optional()
    .describe('Término de búsqueda (busca en nombre y texto alternativo de la imagen)'),
  mime: z
    .string()
    .optional()
    .describe('Filtro por tipo MIME (ej: "image" para todas las imágenes, "image/jpeg", "image/png", etc.)'),
  pagination: z
    .object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
    })
    .optional()
    .describe("Configuración de paginación"),
  sort: z
    .array(z.string())
    .optional()
    .describe('Campos para ordenar (ej: ["createdAt:desc", "name:asc"])'),
};

export const searchMediaToolHandler = async (params: {
  search?: string;
  mime?: string;
  pagination?: { page?: number; pageSize?: number };
  sort?: string[];
}) => {
  try {
    console.error(
      `[SEARCH MEDIA TOOL] Searching media${params.search ? ` with term: ${params.search}` : ""}${
        params.mime ? ` filtered by MIME: ${params.mime}` : ""
      }`
    );

    const result = await strapiClient.searchMedia({
      search: params.search,
      mime: params.mime,
      pagination: params.pagination,
      sort: params.sort,
    });

    // The /api/upload/files endpoint returns an array directly, not { data: [], meta: {} }
    const mediaArray = Array.isArray(result) ? result : (result.data || []);

    const output = {
      success: true,
      data: mediaArray,
      meta: result.meta || {},
      count: mediaArray.length,
    };

    // Format media items for better readability
    let mediaList = "";
    if (output.data.length > 0) {
      mediaList = "\n\n📁 Archivos encontrados:\n";
      output.data.forEach((item: any, index: number) => {
        mediaList += `\n${index + 1}. ${item.name}`;
        mediaList += `\n   📌 ID: ${item.id}`;
        if (item.documentId) {
          mediaList += `\n   🆔 documentId: ${item.documentId}`;
        }
        mediaList += `\n   📊 Tamaño: ${item.size ? (item.size / 1024).toFixed(2) + " KB" : "N/A"}`;
        mediaList += `\n   🎨 Tipo: ${item.mime || "N/A"}`;
        if (item.width && item.height) {
          mediaList += `\n   📐 Dimensiones: ${item.width}x${item.height}px`;
        }
        if (item.url) {
          mediaList += `\n   🔗 URL: ${item.url}`;
        }
        mediaList += "\n";
      });
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully found ${output.count} media items${
            params.search ? ` matching "${params.search}"` : ""
          }${mediaList}\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[SEARCH MEDIA TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error searching media: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
