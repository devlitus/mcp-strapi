# Características de Validación i18n

Este documento describe las nuevas características de validación de idiomas implementadas en el MCP de Strapi.

## 🎯 Resumen de Características

El MCP de Strapi ahora incluye validación avanzada de contenido multiidioma para prevenir inconsistencias y ayudar a identificar problemas de localización.

### Características Implementadas

1. ✅ **Validación de idioma en respuestas** - Detecta automáticamente si el contenido está en un idioma diferente al esperado
2. ✅ **Indicador de herencia de locale** - Muestra si un documento usa contenido heredado (fallback) o traducción propia
3. ✅ **Listado de locales disponibles** - Muestra qué locales tienen traducciones reales vs heredadas
4. ✅ **Validación pre-actualización** - Verifica el contenido antes de actualizar
5. ✅ **Modo estricto** - Opción que falla si no hay traducción propia o hay inconsistencias
6. ✅ **Detección de contenido multiidioma** - Alerta si un campo contiene mezcla de idiomas

---

## 📚 Uso de las Herramientas

### 1. strapi-read - Lectura con Validación

La herramienta `strapi-read` ahora incluye validación automática de idioma cuando se especifica un `locale`.

#### Nuevos Parámetros:

- **`validateLanguage`** (boolean, default: `true`) - Activar/desactivar validación de idioma
- **`strictMode`** (boolean, default: `false`) - Modo estricto: falla si no hay traducción propia

#### Ejemplo Básico:

```javascript
// Leer con validación automática (default)
strapi-read({
  contentType: "categories",
  documentId: "abc123",
  locale: "en"
})

// Resultado incluye:
// ✅ Validación de idioma
// 🌐 Estado de localización (propia vs heredada)
// ⚠️ Advertencias si el contenido no coincide con el idioma esperado
```

#### Ejemplo con Modo Estricto:

```javascript
// En modo estricto, falla si no hay traducción propia
strapi-read({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  strictMode: true
})

// Si "en" no tiene traducción propia:
// ❌ Error: "MODO ESTRICTO: No se permite usar contenido heredado"
```

#### Salida de Ejemplo:

```
Successfully read entry abc123 from categories (locale: en)

📋 Validación de Idioma:
   Locale actual: en
   Estado: ✅ Válido

🌐 Estado de Localización:
   Traducción propia: Sí
   Locales disponibles: es-ES, en, ca
```

---

### 2. strapi-list - Listado con Resumen de Locales

La herramienta `strapi-list` ahora muestra un resumen de localizaciones para cada entrada.

#### Nuevos Parámetros:

- **`showLocalizationSummary`** (boolean, default: `true`) - Mostrar resumen de locales

#### Ejemplo:

```javascript
strapi-list({
  contentType: "categories",
  locale: "en"
})
```

#### Salida de Ejemplo:

```
Successfully listed 3 entries from categories (locale: en)

🌐 Resumen de Localizaciones:

📄 Entrada xyz789:
   Locale actual: en
   Traducciones disponibles: es-ES, en, ca
   Traducción propia: ✅ Sí

📄 Entrada abc123:
   Locale actual: es-ES
   Traducciones disponibles: es-ES, en, ca
   Traducción propia: ⚠️ No (heredada)
   ⚠️ Heredado desde: es-ES
```

---

### 3. strapi-update - Actualización con Validación Pre-Update

La herramienta `strapi-update` ahora valida el contenido **antes** de actualizar.

#### Nuevos Parámetros:

- **`locale`** (string) - Locale específico a actualizar
- **`validateBeforeUpdate`** (boolean, default: `true`) - Validar idioma antes de actualizar
- **`strictMode`** (boolean, default: `false`) - Modo estricto: falla si hay inconsistencias

#### Ejemplo Básico:

```javascript
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  data: {
    description: "Discover our collection of clothing..."
  }
})

// ✅ Valida que el texto esté en inglés
// ⚠️ Alerta si detecta mezcla de idiomas
// ✅ Actualiza y valida el resultado
```

#### Ejemplo con Modo Estricto:

```javascript
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  strictMode: true,
  data: {
    description: "Mixed content with palabras en español"
  }
})

// ❌ Falla con error:
// "Error en modo estricto: No se puede actualizar debido a inconsistencias de idioma"
// Campo "description": ⚠️ Contenido multiidioma detectado: EN (45%), ES (35%)
```

#### Salida de Ejemplo (con advertencias):

```
Successfully updated entry abc123 in categories (locale: en)

⚠️ Advertencias pre-actualización:
Campo "description": ⚠️ Contenido multiidioma detectado: EN (60%), ES (25%)

📋 Validación de Idioma:
   Locale actual: en
   Estado: ⚠️ Advertencias detectadas

🌐 Estado de Localización:
   Traducción propia: Sí
   Locales disponibles: es-ES, en, ca

⚠️ Advertencias:
   Campo "description": ⚠️ Contenido multiidioma detectado: EN (60%), ES (25%)
```

---

## 🔍 Servicio de Validación i18n

### Archivo: `src/services/i18n-validator.ts`

Este servicio proporciona todas las funciones de validación y detección de idiomas.

#### Funciones Principales:

##### 1. `detectLanguage(text: string)`

Detecta el idioma principal de un texto basándose en patrones de palabras comunes.

**Idiomas soportados:** Español, Inglés, Catalán, Francés, Alemán, Italiano

```javascript
const result = detectLanguage("This is an English text");
// {
//   detectedLanguage: "en",
//   confidence: 75,
//   languageScores: { en: 3, es: 0, ca: 0, ... }
// }
```

##### 2. `detectMixedLanguages(text: string, threshold = 0.15)`

Detecta si un texto contiene múltiples idiomas mezclados.

```javascript
const result = detectMixedLanguages("This text tiene palabras en español");
// {
//   isMixed: true,
//   languages: ["en", "es"],
//   scores: { en: 2, es: 2, ... },
//   warning: "⚠️ Contenido multiidioma detectado: EN (50%), ES (50%)"
// }
```

##### 3. `validateContentLanguage(content: string, expectedLocale: string)`

Valida si el contenido coincide con el idioma esperado.

```javascript
const result = validateContentLanguage("Texto en español", "en");
// {
//   isValid: false,
//   expectedLanguage: "en",
//   detectedLanguage: "es",
//   confidence: 80,
//   warning: "⚠️ Inconsistencia de idioma: Se esperaba EN pero se detectó ES"
// }
```

##### 4. `analyzeLocalizationStatus(document: any, requestedLocale?: string)`

Analiza el estado de localización de un documento.

```javascript
const result = analyzeLocalizationStatus(document, "en");
// {
//   documentId: "abc123",
//   currentLocale: "es-ES",
//   isOwnTranslation: true,
//   availableLocales: ["es-ES", "en", "ca"],
//   inheritedFrom: "es-ES",
//   warning: "⚠️ Locale solicitado \"en\" no encontrado. Mostrando fallback desde \"es-ES\""
// }
```

##### 5. `validateDocumentLanguage(document: any, expectedLocale: string, options)`

Validación completa de un documento, incluyendo todos los campos de texto.

**Opciones:**
- `checkMixedLanguages` (boolean, default: `true`)
- `minimumConfidence` (number, default: `30`)
- `strictMode` (boolean, default: `false`)

```javascript
const result = validateDocumentLanguage(document, "en", {
  checkMixedLanguages: true,
  minimumConfidence: 30,
  strictMode: true
});
// {
//   isValid: true/false,
//   locale: "en",
//   warnings: [...],
//   details: {
//     fieldValidations: {...},
//     mixedLanguageChecks: {...},
//     localizationStatus: {...}
//   }
// }
```

---

## 🎨 Ejemplos de Uso Completos

### Escenario 1: Actualizar Descripciones en Múltiples Idiomas

```javascript
// 1. Actualizar español (locale por defecto)
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "es-ES",
  data: {
    description: "Descubre nuestra colección de ropa y accesorios..."
  }
})

// 2. Actualizar inglés
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  data: {
    description: "Discover our collection of clothing and accessories..."
  }
})

// 3. Actualizar catalán
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "ca",
  data: {
    description: "Descobreix la nostra col·lecció de roba i accessoris..."
  }
})
```

### Escenario 2: Verificar Estado de Traducciones

```javascript
// Listar todas las categorías y ver estado de traducciones
strapi-list({
  contentType: "categories",
  locale: "en",
  showLocalizationSummary: true
})

// Verás cuáles tienen traducción propia y cuáles heredan contenido
```

### Escenario 3: Modo Estricto para Contenido Crítico

```javascript
// Para contenido crítico, usar modo estricto
strapi-read({
  contentType: "legal-documents",
  documentId: "terms-conditions",
  locale: "en",
  strictMode: true
})

// Falla si no hay traducción propia en inglés
// Garantiza que no se muestre contenido heredado
```

---

## ⚙️ Configuración

### Variables de Entorno

No se requiere configuración adicional. Las nuevas características están activas por defecto.

### Desactivar Validación

Si prefieres desactivar la validación en casos específicos:

```javascript
// Leer sin validación
strapi-read({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  validateLanguage: false
})

// Actualizar sin validación
strapi-update({
  contentType: "categories",
  documentId: "abc123",
  locale: "en",
  validateBeforeUpdate: false,
  data: { ... }
})

// Listar sin resumen de locales
strapi-list({
  contentType: "categories",
  showLocalizationSummary: false
})
```

---

## 🐛 Solución de Problemas

### Falsos Positivos en Detección de Idioma

Si recibes advertencias de idioma para contenido técnico o con muchos nombres propios:

- **Solución 1:** Desactiva la validación para ese campo específico
- **Solución 2:** El umbral de confianza mínimo es 30%, contenido muy técnico puede dar lecturas bajas
- **Solución 3:** Desactiva `checkMixedLanguages` si tienes términos técnicos en inglés en otros idiomas

### Contenido Heredado No Deseado

Si obtienes contenido del locale por defecto cuando esperabas otro idioma:

- **Causa:** El locale solicitado no tiene traducción propia en Strapi
- **Solución:** Usa `strictMode: true` para que falle en vez de mostrar fallback
- **Verificación:** Usa `strapi-list` con `showLocalizationSummary` para ver qué locales tienen traducciones

---

## 📝 Notas Técnicas

### Algoritmo de Detección de Idioma

El servicio usa detección basada en patrones de palabras comunes (palabras función). Este método es:

- ✅ Rápido y sin dependencias externas
- ✅ Funciona bien para textos con >10 palabras
- ⚠️ Menos preciso con textos muy cortos (<5 palabras)
- ⚠️ Puede dar falsos positivos con jerga técnica internacional

### Limitaciones

1. **Textos Cortos:** La detección es menos confiable con <10 palabras
2. **Contenido Técnico:** Términos técnicos internacionales pueden confundir la detección
3. **Idiomas Soportados:** Actualmente solo: ES, EN, CA, FR, DE, IT
4. **Nombres Propios:** Muchos nombres propios pueden afectar la detección

---

## 🚀 Próximas Mejoras

Posibles mejoras futuras:

- [ ] Soporte para más idiomas (PT, NL, etc.)
- [ ] Detección mejorada para textos cortos
- [ ] Lista blanca de términos técnicos
- [ ] Integración con servicios de traducción automática
- [ ] Sugerencias de corrección automática
- [ ] Métricas de calidad de traducción

---

## 📄 Licencia

MIT
