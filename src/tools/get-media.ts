import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const getMediaToolSchema = {
  id: z
    .union([z.string(), z.number()])
    .describe(
      'ID de la imagen/archivo a obtener. Puede ser el id numérico (ej: 2) o el documentId (ej: "uka5h08v4osgn1w0g89m43z8")'
    ),
};

export const getMediaToolHandler = async (params: { id: string | number }) => {
  try {
    console.error(`[GET MEDIA TOOL] Fetching media file with ID: ${params.id}`);

    const result = await strapiClient.getMedia(params.id);

    const output = {
      success: true,
      data: result,
    };

    // Format media item for better readability
    let mediaInfo = "";
    if (result) {
      mediaInfo = "\n\n📄 Información del archivo:\n";
      mediaInfo += `\n📌 ID: ${result.id}`;
      if (result.documentId) {
        mediaInfo += `\n🆔 documentId: ${result.documentId}`;
      }
      mediaInfo += `\n📝 Nombre: ${result.name}`;
      mediaInfo += `\n📊 Tamaño: ${
        result.size ? (result.size / 1024).toFixed(2) + " KB" : "N/A"
      }`;
      mediaInfo += `\n🎨 Tipo MIME: ${result.mime || "N/A"}`;
      mediaInfo += `\n📅 Creado: ${result.createdAt || "N/A"}`;
      mediaInfo += `\n📅 Actualizado: ${result.updatedAt || "N/A"}`;
      if (result.width && result.height) {
        mediaInfo += `\n📐 Dimensiones: ${result.width}x${result.height}px`;
      }
      if (result.alternativeText) {
        mediaInfo += `\n🏷️ Texto alternativo: ${result.alternativeText}`;
      }
      if (result.caption) {
        mediaInfo += `\n📝 Caption: ${result.caption}`;
      }
      if (result.url) {
        mediaInfo += `\n🔗 URL: ${result.url}`;
      }
      if (result.formats) {
        mediaInfo += `\n\n📐 Formatos disponibles:`;
        Object.entries(result.formats).forEach(([formatName, format]: [string, any]) => {
          mediaInfo += `\n  • ${formatName}: ${format.width}x${format.height}px (${(format.size / 1024).toFixed(2)} KB)`;
          mediaInfo += `\n    URL: ${format.url}`;
        });
      }
      mediaInfo += "\n";
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully retrieved media file${mediaInfo}\n\n${JSON.stringify(
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
    console.error(`[GET MEDIA TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error retrieving media file: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
