# MCP Strapi Server

Un servidor Model Context Protocol (MCP) para operaciones CRUD en Strapi, permitiendo interactuar con cualquier content type de Strapi a través de herramientas estandarizadas.

## Características

- ✅ **13 Herramientas** para operaciones CRUD, gestión de contenidos y medios
- ✅ **Sistema genérico** - funciona con cualquier content type
- ✅ **Fetch nativo** - sin dependencias adicionales (Node.js 22+)
- ✅ **Stdio transport** - integración local con Claude Desktop
- ✅ **TypeScript moderno** - tipado completo y seguro
- ✅ **Gestión de medios** - búsqueda, obtención y carga de archivos
- ✅ **i18n support** - soporte completo para internacionalización

## Requisitos

- Node.js 22+ (para soporte nativo de fetch)
- Strapi corriendo en localhost:1337 (o configurado en STRAPI_URL)

## Instalación

### Opción 1: Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración de Strapi
nano .env

# Compilar TypeScript
npm run build

# Ejecutar servidor
npm start
```

### Opción 2: Desarrollo con Watch Mode

```bash
# Ejecutar con hot-reload (usando tsx)
npm run dev
```

## Configuración en Claude Desktop

Añade el servidor MCP a tu configuración de Claude Desktop:

```json
{
  "mcpServers": {
    "strapi": {
      "command": "node",
      "args": ["/ruta/absoluta/a/mcp-strapi/dist/index.js"],
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_API_TOKEN": "tu-token-opcional"
      }
    }
  }
}
```

## ⚠️ Notas Importantes sobre Content Types

### Uso del parámetro `contentType`

Para las operaciones CRUD (create, read, list, update, delete), **SIEMPRE debes usar el nombre PLURAL** del content type:

✅ **CORRECTO:**
- `"products"`
- `"articles"`
- `"categories"`
- `"profiles"`

❌ **INCORRECTO:**
- `"api::product.product"` (UID completo)
- `"product"` (singular)
- `"Product"` (capitalizado)

### Cómo obtener el nombre correcto

1. Usa la herramienta `strapi-list-content-types` para ver todos los content types disponibles
2. En la respuesta, busca el campo `pluralName` - ese es el valor que debes usar
3. Ejemplo de respuesta:
```json
{
  "uid": "api::product.product",
  "apiID": "product",
  "pluralName": "products"  // ← Usa este valor
}
```

### Excepciones

La herramienta `strapi-add-field` es la ÚNICA que requiere el UID completo:
- ✅ `"api::product.product"` para `strapi-add-field`
- ❌ `"products"` NO funciona con `strapi-add-field`

## Herramientas Disponibles (13 total)

### CRUD Operations (6 tools)

### 1. `strapi-create`

Crea una nueva entrada en un content type.

**Parámetros:**
- `contentType` (string): **Nombre PLURAL** del content type (ej: `"articles"`, `"products"`)
- `data` (object): Datos de la entrada
- `populate` (string[], opcional): Relaciones a poblar

**Ejemplo:**
```json
{
  "contentType": "articles",
  "data": {
    "title": "Mi Artículo",
    "content": "Contenido del artículo",
    "publishedAt": null
  },
  "populate": ["author", "category"]
}
```

**⚠️ IMPORTANTE:** Usa el nombre plural del content type (`"articles"`), NO el UID completo (`"api::article.article"`).

### 2. `strapi-read`

Lee una entrada específica por ID o documentId.

**Parámetros:**
- `contentType` (string): **Nombre PLURAL** del content type (ej: `"articles"`)
- `id` (string | number): ID numérico o documentId (string) de la entrada
- `fields` (string[], opcional): Campos a retornar
- `populate` (string[], opcional): Relaciones a poblar

**Ejemplo:**
```json
{
  "contentType": "articles",
  "id": "abc123xyz",
  "fields": ["title", "content"],
  "populate": ["author"]
}
```

**💡 Nota:** En Strapi v5, el parámetro `id` acepta tanto IDs numéricos como documentIds (strings).

### 3. `strapi-list`

Lista entradas con filtrado, paginación y ordenamiento.

**Parámetros:**
- `contentType` (string): **Nombre PLURAL** del content type (ej: `"articles"`)
- `filters` (object, opcional): Filtros de búsqueda
- `sort` (string[], opcional): Campos de ordenamiento
- `pagination` (object, opcional): Configuración de paginación
- `fields` (string[], opcional): Campos a retornar
- `populate` (string[], opcional): Relaciones a poblar

**Ejemplo:**
```json
{
  "contentType": "articles",
  "filters": {
    "publishedAt": { "$notNull": true }
  },
  "sort": ["createdAt:desc"],
  "pagination": {
    "page": 1,
    "pageSize": 10
  },
  "populate": ["author", "category"]
}
```

### 4. `strapi-update`

Actualiza una entrada existente (actualización parcial).

**Parámetros:**
- `contentType` (string): **Nombre PLURAL** del content type (ej: `"articles"`)
- `id` (string | number): ID numérico o documentId (string) de la entrada
- `data` (object): Datos a actualizar (solo los campos que quieres cambiar)
- `populate` (string[], opcional): Relaciones a poblar

**Ejemplo:**
```json
{
  "contentType": "articles",
  "id": "abc123xyz",
  "data": {
    "title": "Título Actualizado",
    "publishedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 5. `strapi-delete`

Elimina una entrada.

**Parámetros:**
- `contentType` (string): **Nombre PLURAL** del content type (ej: `"articles"`)
- `id` (string | number): ID numérico o documentId (string) de la entrada a eliminar

**Ejemplo:**
```json
{
  "contentType": "articles",
  "id": "abc123xyz"
}
```

**⚠️ Nota:** Puede aparecer un error de "JSON input" después de eliminar, pero la entrada SÍ se elimina correctamente. Esto ocurre porque Strapi retorna una respuesta vacía.

### Content Type Management (3 tools)

- `strapi-list-content-types` - Listar todos los content types disponibles
- `strapi-get-schema` - Obtener schema detallado de un content type
- `strapi-add-field` - Añadir campo a un content type

### Internationalization (1 tool)

- `strapi-get-i18n-locales` - Obtener locales disponibles

### Media Management (3 tools)

- `strapi-search-media` - Buscar archivos en la biblioteca de medios
- `strapi-get-media` - Obtener archivo específico por ID
- `strapi-upload-media` - Subir archivo a la biblioteca de medios

## Ejemplos de Uso con Content Types Personalizados

### Productos
```json
{
  "contentType": "products",
  "data": {
    "name": "Producto Ejemplo",
    "price": 99.99,
    "stock": 100,
    "category": 1
  }
}
```

### Perfiles de Usuario
```json
{
  "contentType": "profiles",
  "data": {
    "displayName": "Juan Pérez",
    "bio": "Desarrollador",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

## Estructura del Proyecto

```
mcp-strapi/
├── docs/                        # Documentación
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # Configuración MCP server
│   ├── tools/                   # Herramientas (13 total)
│   │   ├── create.ts
│   │   ├── create-with-locales.ts
│   │   ├── read.ts
│   │   ├── list.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   ├── list-content-types.ts
│   │   ├── get-schema.ts
│   │   ├── add-field.ts
│   │   ├── get-i18n-locales.ts
│   │   ├── search-media.ts
│   │   ├── get-media.ts
│   │   └── upload-media.ts
│   ├── services/
│   │   ├── strapi-client.ts    # Cliente HTTP (fetch nativo)
│   │   └── i18n-validator.ts   # Validador de internacionalización
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   └── config/
│       └── environment.ts      # Variables de entorno
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── README.md
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `STRAPI_URL` | URL base de la API de Strapi | `http://localhost:1337` |
| `NODE_ENV` | Entorno de ejecución | `production` |

## Debugging

Los logs se escriben a `stderr` para no interferir con el protocolo MCP (que usa `stdout`):

```bash
# Ver logs en desarrollo
npm run dev 2>&1 | grep "ERROR\|CONFIG\|TOOL"
```

## Características implementadas

- ✅ Autenticación con API Tokens de Strapi
- ✅ Validación de i18n con detección de idiomas heredados
- ✅ 13 herramientas completas (CRUD, Content Types, Medios, i18n)
- ✅ Soporte para localizaciones múltiples
- ✅ Gestión completa de medios (búsqueda, descarga, carga)
- ✅ Documentación exhaustiva en CLAUDE.md
- ✅ Strict mode para validaciones de contenido

## Solución de Problemas

### Error: "Node.js 22+ required"
Asegúrate de tener Node.js 22 o superior instalado:
```bash
node --version  # Debe mostrar v22.x.x o superior
```

### Error de conexión a Strapi
Verifica que Strapi esté corriendo y accesible:
```bash
curl http://localhost:1337/api
```


## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Autor

Creado con las mejores prácticas de MCP TypeScript SDK y Strapi Entity Service API.
