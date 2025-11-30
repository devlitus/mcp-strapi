import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createToolSchema, createToolHandler } from "./tools/create.js";
import { readToolSchema, readToolHandler } from "./tools/read.js";
import { listToolSchema, listToolHandler } from "./tools/list.js";
import { updateToolSchema, updateToolHandler } from "./tools/update.js";
import { deleteToolSchema, deleteToolHandler } from "./tools/delete.js";
import {
  listContentTypesToolSchema,
  listContentTypesToolHandler,
} from "./tools/list-content-types.js";
import { addFieldToolSchema, addFieldToolHandler } from "./tools/add-field.js";
import {
  getSchemaToolSchema,
  getSchemaToolHandler,
} from "./tools/get-schema.js";
import {
  getI18nLocalesToolSchema,
  getI18nLocalesToolHandler,
} from "./tools/get-i18n-locales.js";
import {
  createWithLocalesToolSchema,
  createWithLocalesToolHandler,
} from "./tools/create-with-locales.js";
import {
  searchMediaToolSchema,
  searchMediaToolHandler,
} from "./tools/search-media.js";
import {
  getMediaToolSchema,
  getMediaToolHandler,
} from "./tools/get-media.js";
import {
  uploadMediaToolSchema,
  uploadMediaToolHandler,
} from "./tools/upload-media.js";

/**
 * Create and configure the MCP server
 */
export function createMcpServer() {
  const server = new McpServer({
    name: "mcp-strapi",
    version: "1.0.0",
  });

  console.error("[MCP SERVER] Initializing Strapi CRUD tools...");

  // Register CREATE tool
  server.registerTool(
    "strapi-create",
    {
      title: "Strapi Create",
      description:
        'Crea una nueva entrada en un content type de Strapi. IMPORTANTE: usa el nombre PLURAL del content type (ej: "products", "articles"), NO el UID completo (NO uses "api::product.product"). Strapi v5 retorna documentId (string) además del id numérico. Soporta el parámetro "locale" para crear la entrada en un idioma específico (ej: "en", "es-ES", "ca").',
      inputSchema: createToolSchema as any,
    },
    createToolHandler as any
  );

  // Register CREATE WITH LOCALES tool
  server.registerTool(
    "strapi-create-with-locales",
    {
      title: "Strapi Create with Locales",
      description:
        'Crea una entrada con múltiples localizaciones (idiomas) en Strapi v5. En Strapi v5, una SOLA entrada contiene todos los locales con un documentId compartido. ⚠️ IMPORTANTE: El slug y otros campos UID DEBEN ser idénticos en todos los locales. IMPORTANTE: usa el nombre PLURAL del content type (ej: "categories", "products"). Los campos traducibles (name, description) pueden variar por locale, pero campos como slug DEBEN ser iguales.',
      inputSchema: createWithLocalesToolSchema as any,
    },
    createWithLocalesToolHandler as any
  );

  // Register READ tool
  server.registerTool(
    "strapi-read",
    {
      title: "Strapi Read",
      description:
        'Lee una entrada específica por documentId de un content type. IMPORTANTE: usa el nombre PLURAL (ej: "products"). En Strapi v5, usa el "documentId" (string) que es el identificador estable y único de cada entrada. CARACTERÍSTICAS i18n: Incluye validación automática de idioma cuando se especifica "locale" (validateLanguage: true por default), detecta contenido heredado vs traducción propia, y soporta modo estricto (strictMode) que rechaza contenido fallback.',
      inputSchema: readToolSchema as any,
    },
    readToolHandler as any
  );

  // Register LIST tool
  server.registerTool(
    "strapi-list",
    {
      title: "Strapi List",
      description:
        'Lista entradas con filtrado, paginación y ordenamiento. IMPORTANTE: usa el nombre PLURAL (ej: "products", "categories"). Soporta filtros complejos, ordenamiento (ej: ["createdAt:desc"]) y paginación (page/pageSize). Usa populate para incluir relaciones. CARACTERÍSTICAS i18n: Incluye resumen automático de localizaciones (showLocalizationSummary: true por default) que muestra qué locales tienen traducciones propias vs heredadas para cada entrada.',
      inputSchema: listToolSchema as any,
    },
    listToolHandler as any
  );

  // Register UPDATE tool
  server.registerTool(
    "strapi-update",
    {
      title: "Strapi Update",
      description:
        'Actualiza una entrada existente (actualización parcial). IMPORTANTE: usa el nombre PLURAL (ej: "products"). El parámetro "documentId" es el identificador único de la entrada (string). ⚠️ SIEMPRE pregunta al usuario QUÉ documentId quiere actualizar ANTES de ejecutar esta herramienta. Solo envía los campos que quieres actualizar, no es necesario enviar todos los campos. CRÍTICO para i18n: USA el parámetro "locale" para especificar qué idioma actualizar (ej: "en", "es-ES", "ca"). CARACTERÍSTICAS i18n: Validación PRE-actualización de contenido (validateBeforeUpdate: true por default), detecta mezcla de idiomas, validación POST-actualización del resultado, y modo estricto (strictMode) que rechaza actualizaciones con inconsistencias de idioma.',
      inputSchema: updateToolSchema as any,
    },
    updateToolHandler as any
  );

  // Register DELETE tool
  server.registerTool(
    "strapi-delete",
    {
      title: "Strapi Delete",
      description:
        'Elimina una entrada de un content type. IMPORTANTE: usa el nombre PLURAL (ej: "products"). El parámetro "documentId" es el identificador único de la entrada (string). ⚠️ SIEMPRE pregunta al usuario QUÉ documentId quiere eliminar Y solicita que lo CONFIRME antes de ejecutar esta herramienta. NOTA: Es normal recibir un error de "JSON input" después de eliminar - la entrada SÍ se elimina correctamente, solo que Strapi retorna una respuesta vacía.',
      inputSchema: deleteToolSchema as any,
    },
    deleteToolHandler as any
  );

  // Register LIST CONTENT TYPES tool
  server.registerTool(
    "strapi-list-content-types",
    {
      title: "Strapi List Content Types",
      description:
        'Lista todos los content types disponibles en Strapi. Retorna el UID completo (ej: "api::product.product"), el apiID (ej: "product"), y el nombre plural (ej: "products"). IMPORTANTE: Para usar las herramientas CRUD, debes usar el nombre PLURAL, NO el UID.',
      inputSchema: listContentTypesToolSchema as any,
    },
    listContentTypesToolHandler as any
  );

  // Register ADD FIELD tool
  server.registerTool(
    "strapi-add-field",
    {
      title: "Strapi Add Field",
      description:
        'Añade un campo a un content type existente. IMPORTANTE: Para esta herramienta SÍ usa el UID completo (ej: "api::product.product"), NO el nombre plural. REQUIERE permisos especiales de "content-type-builder.update" en el API token. Si recibes "Method Not Allowed", necesitas configurar estos permisos en Strapi.',
      inputSchema: addFieldToolSchema as any,
    },
    addFieldToolHandler as any
  );

  // Register GET SCHEMA tool
  server.registerTool(
    "strapi-get-schema",
    {
      title: "Strapi Get Schema",
      description:
        'Obtiene el schema detallado de un content type, incluyendo campos requeridos y opcionales con sus tipos y validaciones. IMPORTANTE: usa el UID completo (ej: "api::product.product"). Útil para saber qué campos son obligatorios antes de crear una entrada.',
      inputSchema: getSchemaToolSchema as any,
    },
    getSchemaToolHandler as any
  );

  // Register GET I18N LOCALES tool
  server.registerTool(
    "strapi-get-i18n-locales",
    {
      title: "Strapi Get i18n Locales",
      description:
        "Obtiene todos los locales/idiomas disponibles en Strapi para internacionalización (i18n). Retorna el código de idioma (ej: 'es', 'en', 'fr') y el nombre del locale.",
      inputSchema: getI18nLocalesToolSchema as any,
    },
    getI18nLocalesToolHandler as any
  );

  // Register SEARCH MEDIA tool
  server.registerTool(
    "strapi-search-media",
    {
      title: "Strapi Search Media",
      description:
        "Busca imágenes y archivos en la biblioteca de medios de Strapi. Permite búsqueda por nombre, filtrado por tipo MIME (ej: \"image\" para todas las imágenes), paginación y ordenamiento. Útil para encontrar activos específicos en la biblioteca de medios.",
      inputSchema: searchMediaToolSchema as any,
    },
    searchMediaToolHandler as any
  );

  // Register GET MEDIA tool
  server.registerTool(
    "strapi-get-media",
    {
      title: "Strapi Get Media",
      description:
        'Obtiene una imagen o archivo específico de la biblioteca de medios de Strapi por su ID. Acepta tanto el id numérico (ej: 2) como el documentId (ej: "uka5h08v4osgn1w0g89m43z8"). Retorna toda la información del archivo incluyendo URL, dimensiones, formatos disponibles, etc.',
      inputSchema: getMediaToolSchema as any,
    },
    getMediaToolHandler as any
  );

  // Register UPLOAD MEDIA tool
  server.registerTool(
    "strapi-upload-media",
    {
      title: "Strapi Upload Media",
      description:
        "Sube un archivo (imagen, video, documento, etc.) a la biblioteca de medios de Strapi. Requiere la ruta absoluta del archivo en el sistema de archivos. Opcionalmente puedes especificar texto alternativo, caption, nombre personalizado y carpeta de destino. Retorna la información completa del archivo subido incluyendo ID, documentId, URL y formatos generados.",
      inputSchema: uploadMediaToolSchema as any,
    },
    uploadMediaToolHandler as any
  );

  // Register usage instructions prompt
  server.registerPrompt(
    "strapi-usage-guide",
    {
      title: "Strapi MCP Usage Guide",
      description:
        "Get instructions on how to correctly use the Strapi MCP server tools",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `# Guía de Uso del Servidor MCP de Strapi

## ⚠️ IMPORTANTE: Formato del parámetro contentType

Para TODAS las operaciones CRUD (create, read, list, update, delete):
- ✅ USA el nombre PLURAL: "products", "articles", "categories", "profiles"
- ❌ NO uses el UID completo: "api::product.product"
- ❌ NO uses singular: "product"
- ❌ NO uses capitalizado: "Product"

## Cómo obtener el nombre correcto

1. Usa "strapi-list-content-types" para ver todos los content types
2. En la respuesta, busca el campo "pluralName"
3. Ese es el valor que debes usar

Ejemplo de respuesta:
{
  "uid": "api::product.product",
  "apiID": "product",
  "pluralName": "products"  // ← USA ESTE VALOR
}

## Excepción importante

La herramienta "strapi-add-field" es la ÚNICA que requiere el UID completo:
- Para strapi-add-field: usa "api::product.product"
- Para todas las demás: usa "products"

## Notas sobre IDs en Strapi v5

- El parámetro "id" acepta tanto IDs numéricos como documentIds (strings)
- Ejemplo: id puede ser "123" o "abc123xyz"
- Strapi v5 retorna ambos: "id" (número) y "documentId" (string)

## Sobre errores de eliminación

- Es normal recibir error "JSON input" al eliminar
- La entrada SÍ se elimina correctamente
- El error ocurre porque Strapi retorna respuesta vacía

## Workflow recomendado

1. Listar content types disponibles: strapi-list-content-types
2. Identificar el pluralName del content type que necesitas
3. Usar ese pluralName en las operaciones CRUD
4. Para populate, usa los nombres de las relaciones definidas en el schema

## 🌐 Características de Internacionalización (i18n)

### Parámetros i18n disponibles:

**strapi-read:**
- \`locale\`: Idioma a leer (ej: "en", "es-ES", "ca")
- \`validateLanguage\`: Validar idioma automáticamente (default: true)
- \`strictMode\`: Rechazar contenido heredado/fallback (default: false)

**strapi-list:**
- \`locale\`: Filtrar por idioma
- \`showLocalizationSummary\`: Mostrar resumen de traducciones (default: true)

**strapi-update:**
- \`locale\`: ⚠️ CRÍTICO - Especifica qué idioma actualizar
- \`validateBeforeUpdate\`: Validar contenido antes de actualizar (default: true)
- \`strictMode\`: Rechazar actualizaciones con mezcla de idiomas (default: false)

**strapi-create:**
- \`locale\`: Crear entrada en idioma específico

### Ejemplos de uso i18n:

**Actualizar descripción en inglés:**
\`\`\`
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",  // ← IMPORTANTE
  data: { description: "English description..." }
})
\`\`\`

**Leer con modo estricto (solo traducciones propias):**
\`\`\`
strapi-read({
  contentType: "articles",
  documentId: "xyz789",
  locale: "ca",
  strictMode: true  // Falla si no hay traducción en catalán
})
\`\`\`

**Listar y ver estado de traducciones:**
\`\`\`
strapi-list({
  contentType: "products",
  locale: "en",
  showLocalizationSummary: true  // Muestra qué productos tienen traducción en inglés
})
\`\`\`

### Validación automática de idioma:

Las herramientas detectan automáticamente:
✅ Si el contenido está en el idioma correcto
✅ Si hay mezcla de idiomas en un mismo campo
✅ Si la traducción es propia o heredada del locale por defecto
✅ Qué locales están disponibles para cada entrada

### Modo estricto - Cuándo usarlo:

Usa \`strictMode: true\` cuando:
- Trabajas con contenido legal o crítico
- Necesitas garantizar que NO se muestre contenido heredado
- Quieres detectar mezcla de idiomas antes de actualizar

### Mejores prácticas i18n:

1. **SIEMPRE especifica \`locale\` en strapi-update** cuando trabajas con contenido multiidioma
2. Usa strapi-list con showLocalizationSummary para ver el estado de traducciones
3. Usa strictMode para contenido crítico que debe estar completamente traducido
4. Revisa las advertencias de validación - indican problemas reales de contenido`,
            },
          },
        ],
      };
    }
  );

  console.error("[MCP SERVER] Registered 13 Strapi tools:");
  console.error("  CRUD Operations:");
  console.error("    - strapi-create");
  console.error("    - strapi-create-with-locales");
  console.error("    - strapi-read");
  console.error("    - strapi-list");
  console.error("    - strapi-update");
  console.error("    - strapi-delete");
  console.error("  Content Type Management:");
  console.error("    - strapi-list-content-types");
  console.error("    - strapi-get-schema");
  console.error("    - strapi-add-field");
  console.error("  Internationalization (i18n):");
  console.error("    - strapi-get-i18n-locales");
  console.error("  Media Management:");
  console.error("    - strapi-search-media");
  console.error("    - strapi-get-media");
  console.error("    - strapi-upload-media");
  console.error("[MCP SERVER] Registered 1 prompt:");
  console.error(
    "    - strapi-usage-guide (use this to get usage instructions)"
  );

  return server;
}
