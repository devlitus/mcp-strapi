import { z } from "zod";
import { strapiClient } from "../services/strapi-client.js";

/**
 * DOCUMENTACIÓN: strapi-create-with-locales
 *
 * Esta herramienta crea una entrada multilingüe en Strapi v5 de forma FLEXIBLE.
 *
 * ✨ NUEVO: Ahora se adapta automáticamente a los idiomas disponibles en Strapi:
 * - Si pasas "es-ES" pero Strapi solo tiene "es", lo usa automáticamente
 * - Detecta los locales disponibles y los valida antes de usarlos
 * - Salta locales duplicados o conflictivos automáticamente
 * - Te muestra qué locales están realmente disponibles
 *
 * ⚠️ IMPORTANTE - Comportamiento de Strapi v5 i18n:
 * - UNA SOLA entrada contiene todos los locales
 * - Todos comparten el MISMO documentId
 * - El slug DEBE ser idéntico en todos los locales (es un campo UID global)
 * - Los campos traducibles (name, description) pueden variar por locale
 * - Los campos UNIQUE (como "name") deben ser IGUALES en todos los locales por limitación de Strapi
 *
 * ❌ PROBLEMA COMÚN:
 * Si "name" es UNIQUE en tu content type, NO PUEDES usar nombres traducidos.
 * Solución: El "name" debe ser IGUAL en todos los locales, solo traducir "description"
 *
 * Flujo interno:
 * 1. GET /api/i18n/locales → Obtiene locales disponibles (¡NUEVO!)
 * 2. POST /api/categories?locale=es → Crea entrada en español (adaptado automáticamente)
 * 3. PUT /api/categories/{id}?locale=en → Actualiza la MISMA entrada en inglés
 * 4. PUT /api/categories/{id}?locale=ca → Actualiza la MISMA entrada en catalán
 *
 * Resultado: Una entry con múltiples versiones de contenido, 1 documentId compartido
 */

export const createWithLocalesToolSchema = z.object({
  contentType: z
    .string()
    .describe('Nombre PLURAL del content type (ej: "products", "categories")'),
  defaultLocale: z.string().describe('Locale por defecto (ej: "es-ES")'),
  data: z
    .record(z.any())
    .describe("Datos de la entrada en el locale por defecto"),
  localizations: z
    .array(
      z.object({
        locale: z.string().describe('Código del locale (ej: "en", "ca")'),
        data: z.record(z.any()).describe("Datos de la entrada en este locale"),
      })
    )
    .optional()
    .describe("Array de localizaciones para otros idiomas"),
  populate: z.array(z.string()).optional().describe("Relaciones a poblar"),
});

export const createWithLocalesToolHandler = async (params: {
  contentType: string;
  defaultLocale: string;
  data: Record<string, any>;
  localizations?: Array<{ locale: string; data: Record<string, any> }>;
  populate?: string[];
}) => {
  try {
    console.error(
      `[CREATE WITH LOCALES TOOL] Creating entry in ${
        params.contentType
      } with ${(params.localizations?.length || 0) + 1} locale(s)`
    );

    // Validación previa: Verificar que los datos tengan campos requeridos
    if (!params.data || Object.keys(params.data).length === 0) {
      throw new Error(
        "data no puede estar vacío. Proporciona al menos los campos requeridos."
      );
    }

    // PASO 0: Obtener todos los idiomas disponibles en Strapi
    console.error(
      `[CREATE WITH LOCALES TOOL] Step 0: Fetching available locales from Strapi...`
    );
    let availableLocales: string[] = [];
    try {
      const localesResponse = await strapiClient.getI18nLocales();
      console.error(
        `[CREATE WITH LOCALES TOOL] Locales Response Structure:`,
        JSON.stringify(localesResponse, null, 2)
      );

      // Manejar ambas estructuras posibles de respuesta
      let localesData =
        localesResponse?.data ||
        localesResponse?.locales ||
        (Array.isArray(localesResponse) ? localesResponse : undefined);

      if (!localesData || !Array.isArray(localesData)) {
        throw new Error(
          `Invalid response structure from i18n locales API. Response: ${JSON.stringify(
            localesResponse
          )}`
        );
      }

      availableLocales = localesData.map((locale: any) => locale.code);
      console.error(
        `[CREATE WITH LOCALES TOOL] ✅ Available locales: ${availableLocales.join(
          ", "
        )}`
      );
    } catch (localesError) {
      const errorMsg =
        localesError instanceof Error
          ? localesError.message
          : String(localesError);
      throw new Error(
        `Error fetching available locales: ${errorMsg}. Make sure i18n plugin is enabled in Strapi.`
      );
    }

    // Normalizar defaultLocale: si el usuario pasa "es-ES" pero solo existe "es", adaptarse
    let effectiveDefaultLocale = params.defaultLocale;
    if (!availableLocales.includes(params.defaultLocale)) {
      const localeBase = params.defaultLocale.split("-")[0]; // obtener "es" de "es-ES"
      const matchedLocale = availableLocales.find(
        (loc) => loc.split("-")[0] === localeBase
      );

      if (matchedLocale) {
        console.error(
          `[CREATE WITH LOCALES TOOL] ⚠️ Locale ${params.defaultLocale} not found, using ${matchedLocale} instead`
        );
        effectiveDefaultLocale = matchedLocale;
      } else {
        throw new Error(
          `Locale ${
            params.defaultLocale
          } is not available. Available locales: ${availableLocales.join(", ")}`
        );
      }
    }

    // Validar y normalizar localizaciones
    const normalizedLocalizations = [];
    if (params.localizations && params.localizations.length > 0) {
      for (const localization of params.localizations) {
        let effectiveLocale = localization.locale;

        // Si el locale no existe exactamente, intentar adaptación
        if (!availableLocales.includes(localization.locale)) {
          const localeBase = localization.locale.split("-")[0];
          const matchedLocale = availableLocales.find(
            (loc) => loc.split("-")[0] === localeBase
          );

          if (matchedLocale && matchedLocale !== effectiveDefaultLocale) {
            console.error(
              `[CREATE WITH LOCALES TOOL] ⚠️ Locale ${localization.locale} not found, using ${matchedLocale} instead`
            );
            effectiveLocale = matchedLocale;
          } else if (!matchedLocale) {
            console.error(
              `[CREATE WITH LOCALES TOOL] ⚠️ Skipping locale ${localization.locale} - not available in Strapi`
            );
            continue; // Saltar este locale si no hay match
          } else {
            console.error(
              `[CREATE WITH LOCALES TOOL] ⚠️ Skipping locale ${matchedLocale} - already set as default`
            );
            continue;
          }
        }

        // No duplicar el locale por defecto
        if (effectiveLocale === effectiveDefaultLocale) {
          console.error(
            `[CREATE WITH LOCALES TOOL] ⚠️ Skipping ${effectiveLocale} - already set as default locale`
          );
          continue;
        }

        normalizedLocalizations.push({
          locale: effectiveLocale,
          data: localization.data,
        });
      }
    }

    // IMPORTANTE: En Strapi v5 con i18n, una sola entrada contiene todos los locales
    // NO se crean entradas separadas, sino que se actualiza la misma entrada con datos para cada locale

    // Paso 1: Crear la entrada principal en el locale por defecto
    console.error(
      `[CREATE WITH LOCALES TOOL] Step 1: Creating main entry in ${effectiveDefaultLocale}...`
    );
    let mainResult;
    try {
      mainResult = await strapiClient.create({
        contentType: params.contentType,
        data: params.data,
        populate: params.populate,
        locale: effectiveDefaultLocale,
      });
    } catch (createError) {
      const errorMsg =
        createError instanceof Error
          ? createError.message
          : String(createError);
      throw new Error(
        `Error al crear entrada en ${effectiveDefaultLocale}: ${errorMsg}`
      );
    }

    const mainDocumentId = mainResult.data.documentId || mainResult.data.id;
    console.error(
      `[CREATE WITH LOCALES TOOL] ✅ Created main entry with documentId: ${mainDocumentId}`
    );

    // Paso 2: Si hay localizaciones, actualizar la entrada con datos para cada locale
    const createdLocalizations: any[] = [];

    if (normalizedLocalizations && normalizedLocalizations.length > 0) {
      for (let i = 0; i < normalizedLocalizations.length; i++) {
        const localization = normalizedLocalizations[i];
        try {
          console.error(
            `[CREATE WITH LOCALES TOOL] Step ${i + 2}: Updating entry with ${
              localization.locale
            } localization...`
          );

          // Validar que la data de localización no esté vacía
          if (
            !localization.data ||
            Object.keys(localization.data).length === 0
          ) {
            throw new Error(
              `Data para locale ${localization.locale} no puede estar vacía`
            );
          }

          // Actualizar la MISMA entrada con datos del nuevo locale
          const localeResult = await strapiClient.update({
            contentType: params.contentType,
            documentId: mainDocumentId,
            data: localization.data,
            populate: params.populate,
            locale: localization.locale,
          });

          console.error(
            `[CREATE WITH LOCALES TOOL] ✅ Updated entry with ${localization.locale} localization`
          );

          createdLocalizations.push({
            locale: localization.locale,
            documentId: mainDocumentId, // La misma entrada
            data: localeResult.data,
          });
        } catch (locError) {
          const errorMsg =
            locError instanceof Error ? locError.message : String(locError);
          console.error(
            `[CREATE WITH LOCALES TOOL] ❌ Error updating localization for ${localization.locale}: ${errorMsg}`
          );
          throw new Error(
            `Error al crear localización ${localization.locale}: ${errorMsg}`
          );
        }
      }
    }

    const output = {
      success: true,
      defaultLocale: effectiveDefaultLocale,
      message: "Entry created successfully with all localizations",
      localesCreated: normalizedLocalizations.length + 1,
      availableLocales: availableLocales,
      usedLocales: [
        effectiveDefaultLocale,
        ...normalizedLocalizations.map((l) => l.locale),
      ],
      mainEntry: {
        documentId: mainDocumentId,
        locale: effectiveDefaultLocale,
        data: mainResult.data,
      },
      localizations: createdLocalizations,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `✅ Successfully created entry with locales in ${
            params.contentType
          }\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[CREATE WITH LOCALES TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error creating entry with locales in ${params.contentType}:\n\n${errorMessage}\n\n💡 SOLUCIÓN:\n\n1. Si ves "This attribute must be unique":\n   - El campo 'name' es UNIQUE en tu content type\n   - En Strapi v5 i18n, los campos UNIQUE deben ser IGUALES en todos los locales\n   - Solución: Usa el MISMO "name" en data y localizations, solo traduce "description"\n   \n2. Ejemplos de uso correcto:\n   ✅ name: "Camisetas" (igual en todos)\n   ✅ slug: "camisetas" (igual en todos)\n   ✅ description: "Camisetas coloridas..." (DIFERENTE en cada locale)\n\n3. Para ver qué campos son UNIQUE:\n   - Usa: strapi-get-schema con tu content type\n   - Los campos UNIQUE NO pueden cambiar por locale\n\n4. Si tienes problemas con locales:\n   - La herramienta ahora se adapta automáticamente a los idiomas disponibles\n   - Si pasas "es-ES" pero Strapi solo tiene "es", se adaptará automáticamente\n   - Se omitirán locales que no existan o duplicados`,
        },
      ],
      isError: true,
    };
  }
};

/**
 * Comentario de referencia sobre cómo funciona i18n en Strapi v5:
 *
 * En Strapi v5, el sistema de internacionalización (i18n) funciona de la siguiente manera:
 * - Una sola entrada (documentId) contiene todos los locales
 * - Cuando creas una entrada con ?locale=es-ES, creas la entrada en ese locale
 * - Cuando actualizas la misma entrada con ?locale=en, actualizas los datos EN ESE LOCALE
 * - NO se crean entries separadas, sino que es la misma entry con datos diferentes por locale
 * - El campo "localizations" es una relación entre entradas DIFERENTES si quieres contenido separado
 *
 * Para crear content type multilingüe:
 * 1. POST /api/categories?locale=es-ES con datos en español
 * 2. PUT /api/categories/{documentId}?locale=en con datos en inglés
 * 3. PUT /api/categories/{documentId}?locale=ca con datos en catalán
 *
 * Resultado: Una sola entry con 3 versiones de contenido (es-ES, en, ca)
 */
