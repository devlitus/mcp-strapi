# 🎉 Nuevas Funcionalidades - Gestión de Content Types y Localizaciones

## Resumen

El servidor MCP de Strapi ahora incluye **3 nuevas herramientas** para gestionar la estructura de los content types y crear entradas con múltiples localizaciones:

1. **strapi-list-content-types** - Lista todos los content types
2. **strapi-add-field** - Añade campos a content types existentes
3. **strapi-create-with-locales** - Crea entradas con múltiples idiomas/locales

## 🔧 Configuración Requerida

### API Token de Strapi

Estas funcionalidades requieren un **API Token con acceso completo** configurado en `.env`:

```env
STRAPI_API_TOKEN=your-token-here
```

### Cómo obtener el API Token:

1. Abre el panel de administración de Strapi: `http://localhost:1337/admin`
2. Ve a **Settings → API Tokens**
3. Crea un nuevo token:
   - **Name**: MCP Server
   - **Token duration**: Unlimited
   - **Token type**: Full access
4. Copia el token y añádelo a tu archivo `.env`

## 📋 Nuevas Herramientas

### 1. strapi-list-content-types

Lista todos los content types disponibles en tu instancia de Strapi.

**Parámetros:** Ninguno

**Ejemplo de uso:**

```
Listar todos los content types disponibles
```

**Respuesta:**

```json
{
  "success": true,
  "count": 3,
  "contentTypes": [
    {
      "uid": "api::product.product",
      "apiID": "product",
      "kind": "collectionType",
      "displayName": "Product",
      "singularName": "product",
      "pluralName": "products",
      "attributes": ["id", "createdAt", "updatedAt"]
    }
  ]
}
```

### 2. strapi-add-field

Añade un nuevo campo a un content type existente.

**Parámetros:**

- `contentType` (string, requerido): UID del content type (ej: "api::product.product")
- `fieldName` (string, requerido): Nombre del campo (ej: "title", "price")
- `fieldType` (string, requerido): Tipo del campo
- `options` (object, opcional): Opciones adicionales

**Tipos de campo disponibles:**

- `string` - Texto corto
- `text` - Texto largo
- `richtext` - Texto enriquecido (HTML/Markdown)
- `email` - Email
- `password` - Contraseña
- `integer` - Número entero
- `biginteger` - Número entero grande
- `float` - Número decimal
- `decimal` - Número decimal preciso
- `date` - Fecha
- `time` - Hora
- `datetime` - Fecha y hora
- `timestamp` - Marca de tiempo
- `boolean` - Booleano (true/false)
- `enumeration` - Enumeración (lista de opciones)
- `json` - JSON
- `uid` - Identificador único

**Opciones comunes:**

- `required` (boolean): Campo obligatorio
- `unique` (boolean): Valor único
- `minLength` (number): Longitud mínima (para strings)
- `maxLength` (number): Longitud máxima (para strings)
- `min` (number): Valor mínimo (para números)
- `max` (number): Valor máximo (para números)
- `default` (any): Valor por defecto
- `enum` (array): Opciones para enumeraciones

**Ejemplo de uso:**

```
Añade un campo "title" de tipo string al content type api::product.product con las opciones required=true y maxLength=200
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Field 'title' added successfully to api::product.product",
  "fieldName": "title",
  "fieldType": "string",
  "options": {
    "required": true,
    "maxLength": 200
  }
}
```

**⚠️ IMPORTANTE:** Después de añadir campos, puede ser necesario reiniciar Strapi para que los cambios tomen efecto.

### 3. strapi-create-with-locales

**NUEVA:** Crea una entrada en un content type junto con sus localizaciones (traducciones) en diferentes idiomas de una sola vez.

**Parámetros:**

- `contentType` (string, requerido): Nombre PLURAL del content type (ej: "categories", "products")
- `defaultLocale` (string, requerido): Código del locale por defecto (ej: "es-ES")
- `data` (object, requerido): Datos de la entrada en el locale por defecto
- `localizations` (array, opcional): Array de localizaciones para otros idiomas
  - `locale` (string): Código del locale (ej: "en", "ca")
  - `data` (object): Datos de la entrada en ese locale
- `populate` (array, opcional): Relaciones a poblar

**Ejemplo de uso:**

```
Crea una categoría en español, inglés y catalán:
- Español (es): name="Tops", description="Camisetas, camisas y blusas infantiles"
- Inglés (en): name="Tops", description="T-shirts, shirts and children's blouses"
- Catalán (ca): name="Tops", description="Samarretes, camises i blusas infantils"
```

**Respuesta:**

```json
{
  "success": true,
  "defaultLocale": "es",
  "mainEntry": {
    "documentId": "rk3dq0s0wkzejepfai1xxd6z",
    "locale": "es",
    "data": { "name": "Tops", ... }
  },
  "localizations": [
    {
      "locale": "en",
      "documentId": "abc123xyz",
      "data": { "name": "Tops", ... }
    },
    {
      "locale": "ca",
      "documentId": "def456uvw",
      "data": { "name": "Tops", ... }
    }
  ]
}
```

**Ventajas:**

- ✅ Crea múltiples localizaciones en un solo comando
- ✅ Automáticamente vincula todas las entradas
- ✅ Evita crear localizaciones duplicadas sin vincular
- ✅ Retorna documentIds de todas las entradas creadas

**Casos de uso:**

- Crear categorías multilingües de productos
- Crear artículos de blog en varios idiomas
- Crear perfiles de usuario en diferentes locales
- Crear cualquier content type que necesite ser multilingüe desde el inicio

Para más detalles sobre esta herramienta, consulta: [CREATE-WITH-LOCALES.md](./CREATE-WITH-LOCALES.md)

## 🛠️ Ejemplo Completo: Crear Content Type para Productos

### Paso 1: Verificar content types existentes

```
Lista los content types disponibles
```

### Paso 2: Añadir campo "title"

```
Añade el campo "title" de tipo "string" al content type "api::product.product" con required=true y maxLength=200
```

### Paso 3: Añadir campo "description"

```
Añade el campo "description" de tipo "text" al content type "api::product.product"
```

### Paso 4: Añadir campo "price"

```
Añade el campo "price" de tipo "decimal" al content type "api::product.product" con required=true y min=0
```

### Paso 5: Añadir campo "category"

```
Añade el campo "category" de tipo "string" al content type "api::product.product"
```

### Paso 6: Añadir campo "ageMin"

```
Añade el campo "ageMin" de tipo "integer" al content type "api::product.product" con min=0
```

### Paso 7: Añadir campo "ageMax"

```
Añade el campo "ageMax" de tipo "integer" al content type "api::product.product" con min=0
```

### Paso 8: Reiniciar Strapi (si es necesario)

### Paso 9: Crear el producto

```
Crea un producto con title="Camiseta Mickey", description="Camiseta infantil con estampado de Mickey Mouse para niños de 3-10 años", price=29.99, category="ropa infantil", ageMin=3, ageMax=10
```

## 🔄 Reiniciar el Servidor MCP

Después de actualizar el código, reinicia el servidor MCP:

### En desarrollo:

```bash
npm run dev
```

### En producción:

```bash
npm run build
npm start
```

### En Claude Desktop:

Reinicia la aplicación Claude Desktop para que reconozca las nuevas herramientas.

## 📝 Notas Técnicas

- Las herramientas usan la API de Content-Type Builder de Strapi
- Requieren autenticación con API Token
- Los cambios en la estructura pueden requerir reiniciar Strapi
- Se recomienda hacer backup antes de modificar content types en producción

## 🐛 Solución de Problemas

### Error: "Unauthorized" o "Forbidden"

- Verifica que el API Token esté correctamente configurado en `.env`
- Asegúrate de que el token tenga acceso completo (Full access)

### Error: "Not Found"

- Verifica que el content type exista con el UID correcto
- Usa `strapi-list-content-types` para ver los UIDs disponibles

### Los campos no aparecen después de añadirlos

- Reinicia el servidor de Strapi
- Verifica que el campo se haya añadido correctamente en Content-Type Builder

## 📚 Referencias

- [Strapi Content-Type Builder API](https://docs.strapi.io/dev-docs/api/content-type-builder)
- [Strapi API Tokens](https://docs.strapi.io/user-docs/settings/API-tokens)
- [Model Context Protocol](https://modelcontextprotocol.io/)
