import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

export const getI18nLocalesToolSchema = z.object({});

export const getI18nLocalesToolHandler = async () => {
  try {
    console.error("[GET I18N LOCALES TOOL] Fetching available locales");

    const result = await strapiClient.getI18nLocales();

    // The endpoint returns an array directly
    const locales = Array.isArray(result) ? result : result.data || [];

    const output = {
      success: true,
      data: locales,
      count: locales.length,
      locales: locales.map((locale: any) => ({
        id: locale.id,
        code: locale.code,
        name: locale.name,
      })),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully retrieved ${
            output.count
          } i18n locales\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[GET I18N LOCALES TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `Error retrieving i18n locales: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
