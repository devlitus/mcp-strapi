import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const uploadMediaToolSchema = {
  filePath: z
    .string()
    .describe(
      "Ruta absoluta del archivo a subir (ej: C:\\Users\\usuario\\imagen.jpg)"
    ),
  alternativeText: z
    .string()
    .optional()
    .describe("Texto alternativo para la imagen (para accesibilidad)"),
  caption: z.string().optional().describe("Descripción o caption del archivo"),
  name: z.string().optional().describe("Nombre personalizado para el archivo"),
  folder: z
    .string()
    .optional()
    .describe("ID de la carpeta donde guardar el archivo"),
};

export const uploadMediaToolHandler = async (params: {
  filePath: string;
  alternativeText?: string;
  caption?: string;
  name?: string;
  folder?: string;
}) => {
  try {
    console.error(`[UPLOAD MEDIA TOOL] Uploading file: ${params.filePath}`);

    const result = await strapiClient.uploadMedia({
      filePath: params.filePath,
      alternativeText: params.alternativeText,
      caption: params.caption,
      name: params.name,
      folder: params.folder,
    });

    // The upload endpoint returns an array of uploaded files
    const uploadedFiles = Array.isArray(result) ? result : [result];
    const firstFile = uploadedFiles[0];

    const output = {
      success: true,
      data: uploadedFiles,
      count: uploadedFiles.length,
    };

    // Format upload result for better readability
    let uploadInfo = "";
    if (firstFile) {
      uploadInfo = "\n\n✅ Archivo subido exitosamente:\n";
      uploadInfo += `\n📌 ID: ${firstFile.id}`;
      if (firstFile.documentId) {
        uploadInfo += `\n🆔 documentId: ${firstFile.documentId}`;
      }
      uploadInfo += `\n📝 Nombre: ${firstFile.name}`;
      uploadInfo += `\n📊 Tamaño: ${
        firstFile.size ? (firstFile.size / 1024).toFixed(2) + " KB" : "N/A"
      }`;
      uploadInfo += `\n🎨 Tipo MIME: ${firstFile.mime || "N/A"}`;
      if (firstFile.width && firstFile.height) {
        uploadInfo += `\n📐 Dimensiones: ${firstFile.width}x${firstFile.height}px`;
      }
      if (firstFile.url) {
        uploadInfo += `\n🔗 URL: ${firstFile.url}`;
      }
      if (firstFile.formats) {
        uploadInfo += `\n\n📐 Formatos generados:`;
        Object.entries(firstFile.formats).forEach(([formatName, format]: [string, any]) => {
          uploadInfo += `\n  • ${formatName}: ${format.width}x${format.height}px`;
        });
      }
      uploadInfo += "\n";
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `File uploaded successfully!${uploadInfo}\n\n${JSON.stringify(
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
    console.error(`[UPLOAD MEDIA TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error uploading file: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
