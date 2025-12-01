# Herramienta: strapi-create-with-locales

## Descripción

La herramienta `strapi-create-with-locales` permite crear una entrada multilingüe en Strapi v5. A diferencia de versiones anteriores, **en Strapi v5 una sola entrada contiene todos los locales** con un documentId compartido.

Esta herramienta:

1. ✅ Crea la entrada en el locale por defecto
2. ✅ Actualiza la misma entrada con datos para cada locale adicional
3. ✅ Retorna un documentId único compartido por todos los locales

## Parámetros

### Requeridos

- **contentType** (string): Nombre PLURAL del content type (ej: "categories", "products")
- **defaultLocale** (string): El locale principal (ej: "es", "en")
- **data** (object): Los datos de la entrada en el locale por defecto

### Opcionales

- **localizations** (array): Array de localizaciones para otros idiomas
  - **locale** (string): Código del locale (ej: "en", "ca")
  - **data** (object): Datos de la entrada en ese locale
- **populate** (array): Relaciones a poblar (ej: ["products", "category"])

## ⚠️ IMPORTANTE: Campos UID (slug) y campos UNIQUE

En Strapi v5 con i18n:

- **Campos traducibles** (name, description): Pueden ser diferentes en cada locale
- **Campos UID** (slug): DEBEN ser iguales en todos los locales
- **Campos UNIQUE** (como "name" si está marcado como unique): DEBEN ser iguales en todos los locales
- **El slug es único globalmente**, no por locale
- Si cambias el slug en un locale, cambias en todos

### ❌ PROBLEMA COMÚN EN TU CONTENT TYPE:

Si el campo **"name" es UNIQUE**, entonces:

- ✅ `name`: "Camisetas" (igual en todos los locales)
- ❌ `name`: "Camisetas" en es, "T-shirts" en en, "Samarretes" en ca (ERROR)

**Solución**: Usa el MISMO nombre en todos los locales, solo traduce los campos NO-UNIQUE como "description"

## Ejemplo de uso

```json
{
  "contentType": "categories",
  "defaultLocale": "es",
  "data": {
    "name": "Tops",
    "slug": "tops-infantiles",
    "description": "Camisetas, camisas y blusas infantiles",
    "icon": "👕",
    "order": 1,
    "isActive": true
  },
  "localizations": [
    {
      "locale": "en",
      "data": {
        "name": "Tops",
        "slug": "tops-infantiles",
        "description": "T-shirts, shirts and children's blouses",
        "icon": "👕",
        "order": 1,
        "isActive": true
      }
    },
    {
      "locale": "ca",
      "data": {
        "name": "Tops",
        "slug": "tops-infantiles",
        "description": "Samarretes, camises i blusas infantils",
        "icon": "👕",
        "order": 1,
        "isActive": true
      }
    }
  ]
}
```

### Observaciones del ejemplo:

- ✅ El **slug es idéntico** en todos los locales: `"tops-infantiles"`
- ✅ El **name es idéntico** en todos los locales: `"Tops"` (porque es UNIQUE)
- ✅ El **description varía** según el idioma (porque NO es UNIQUE)
- ✅ Otros campos (icon, order, isActive) son iguales

## Respuesta

La herramienta retorna:

```json
{
  "success": true,
  "defaultLocale": "es",
  "message": "Entry created successfully with all localizations",
  "mainEntry": {
    "documentId": "rk3dq0s0wkzejepfai1xxd6z",
    "locale": "es",
    "data": { "name": "Tops", "slug": "tops-infantiles", ... }
  },
  "localizations": [
    {
      "locale": "en",
      "documentId": "rk3dq0s0wkzejepfai1xxd6z",
      "data": { "name": "Tops", "slug": "tops-infantiles", ... }
    },
    {
      "locale": "ca",
      "documentId": "rk3dq0s0wkzejepfai1xxd6z",
      "data": { "name": "Tops", "slug": "tops-infantiles", ... }
    }
  ]
}
```

### Observaciones de la respuesta:

- ✅ **Un solo documentId** compartido por todos los locales: `"rk3dq0s0wkzejepfai1xxd6z"`
- ✅ El slug es idéntico en todos: `"tops-infantiles"`
- ✅ El name es idéntico en todos: `"Tops"`
- ✅ Cada locale tiene sus propios datos traducidos (description)

## Cómo funciona internamente

1. **POST /api/categories?locale=es** → Crea la entrada principal en español

   - Retorna: documentId = `abc123`

2. **PUT /api/categories/abc123?locale=en** → Actualiza la MISMA entrada con datos en inglés

   - Retorna: documentId = `abc123` (el mismo)

3. **PUT /api/categories/abc123?locale=ca** → Actualiza la MISMA entrada con datos en catalán
   - Retorna: documentId = `abc123` (el mismo)

**Resultado final**: Una sola entry (`abc123`) que contiene 3 versiones de contenido (es, en, ca)

## Ventajas

- ✅ Crea múltiples localizaciones en un solo comando
- ✅ Un solo documentId para todos los locales (más eficiente)
- ✅ Evita crear entradas duplicadas innecesariamente
- ✅ Compatible con Strapi v5 i18n
- ✅ Manejo automático de campos UID globales

## Casos de uso

- ✅ Crear categorías de productos multilingües
- ✅ Crear artículos de blog en varios idiomas
- ✅ Crear páginas de contenido en múltiples locales
- ✅ Crear cualquier content type multilingüe desde el inicio
- ✅ Evitar crear entradas separadas cuando necesitas UNA SOLA entrada en varios idiomas

## Errores comunes

### ❌ Error: "This attribute must be unique"

**Causa**: Un campo UNIQUE (como "name") tiene valores diferentes en los locales
**Solución**: Usa el MISMO valor en todos los locales para campos UNIQUE

**Cómo verificar si un campo es UNIQUE**:

```
strapi-get-schema con contentType="api::category.category"
```

En la respuesta busca campos con `"unique": true`

### ❌ El slug es diferente en cada locale

**Problema**: En Strapi v5, el slug debe ser IGUAL en todos los locales
**Solución**: Usa el MISMO slug en data y todas las localizations

## Flujo de trabajo recomendado

1. **Obtén el schema** del content type con `strapi-get-schema`
2. **Identifica qué campos son UID** (como slug) - estos deben ser iguales
3. **Identifica qué campos son traducibles** (como name, description) - estos pueden variar
4. **Crea la entrada multilingüe** con esta herramienta, usando:
   - El MISMO slug en todos los locales
   - Traducciones diferentes para name, description, etc.
