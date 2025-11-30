/**
 * I18n Validation and Detection Service
 *
 * Provides utilities to validate, detect, and analyze multilingual content in Strapi
 */

/**
 * Language detection patterns for common languages
 */
const LANGUAGE_PATTERNS = {
  es: /\b(el|la|los|las|un|una|de|del|en|por|para|con|que|como|pero|más|muy|esto|esta|este|estos|estas|son|está|están|hay|ser|fue|sido)\b/gi,
  en: /\b(the|a|an|of|in|on|at|to|for|with|and|or|but|is|are|was|were|be|been|have|has|had|this|that|these|those)\b/gi,
  ca: /\b(el|la|els|les|un|una|de|del|en|per|amb|que|com|però|més|molt|això|aquesta|aquest|aquests|aquestes|són|està|estan|hi|ser|fou|estat)\b/gi,
  fr: /\b(le|la|les|un|une|de|du|des|en|dans|sur|pour|avec|et|ou|mais|est|sont|être|été|avoir|a|eu|ce|cette|ces)\b/gi,
  de: /\b(der|die|das|den|dem|des|ein|eine|einem|eines|und|oder|aber|ist|sind|war|waren|sein|gewesen|haben|hat|hatte)\b/gi,
  it: /\b(il|lo|la|i|gli|le|un|uno|una|di|da|in|su|per|con|e|o|ma|è|sono|era|erano|essere|stato|avere|ha|questo|questa)\b/gi,
};

/**
 * Expected language codes for common locales
 */
const LOCALE_TO_LANGUAGE: Record<string, string> = {
  'es': 'es',
  'es-ES': 'es',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'ca': 'ca',
  'ca-ES': 'ca',
  'fr': 'fr',
  'fr-FR': 'fr',
  'de': 'de',
  'de-DE': 'de',
  'it': 'it',
  'it-IT': 'it',
};

/**
 * Detect the primary language of a text based on word patterns
 */
export function detectLanguage(text: string): {
  detectedLanguage: string | null;
  confidence: number;
  languageScores: Record<string, number>;
} {
  if (!text || text.trim().length === 0) {
    return {
      detectedLanguage: null,
      confidence: 0,
      languageScores: {},
    };
  }

  const scores: Record<string, number> = {};
  const wordCount = text.split(/\s+/).length;

  // Count matches for each language
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }

  // Find the language with the highest score
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topLanguage = sortedScores[0];

  if (!topLanguage || topLanguage[1] === 0) {
    return {
      detectedLanguage: null,
      confidence: 0,
      languageScores: scores,
    };
  }

  // Calculate confidence as a percentage
  const confidence = Math.min(100, (topLanguage[1] / wordCount) * 100);

  return {
    detectedLanguage: topLanguage[0],
    confidence: Math.round(confidence),
    languageScores: scores,
  };
}

/**
 * Check if text contains multiple languages mixed together
 */
export function detectMixedLanguages(text: string, threshold: number = 0.15): {
  isMixed: boolean;
  languages: string[];
  scores: Record<string, number>;
  warning?: string;
} {
  if (!text || text.trim().length === 0) {
    return { isMixed: false, languages: [], scores: {} };
  }

  const detection = detectLanguage(text);
  const wordCount = text.split(/\s+/).length;

  // Check if multiple languages have significant presence
  const significantLanguages = Object.entries(detection.languageScores)
    .filter(([_, count]) => (count / wordCount) >= threshold)
    .sort((a, b) => b[1] - a[1]);

  const isMixed = significantLanguages.length > 1;

  if (isMixed) {
    return {
      isMixed: true,
      languages: significantLanguages.map(([lang]) => lang),
      scores: detection.languageScores,
      warning: `⚠️ Contenido multiidioma detectado: ${significantLanguages.map(([lang, count]) =>
        `${lang.toUpperCase()} (${Math.round((count / wordCount) * 100)}%)`
      ).join(', ')}`,
    };
  }

  return {
    isMixed: false,
    languages: detection.detectedLanguage ? [detection.detectedLanguage] : [],
    scores: detection.languageScores,
  };
}

/**
 * Validate if content matches the expected locale
 */
export function validateContentLanguage(
  content: string,
  expectedLocale: string,
  minimumConfidence: number = 30
): {
  isValid: boolean;
  expectedLanguage: string;
  detectedLanguage: string | null;
  confidence: number;
  warning?: string;
} {
  const expectedLanguage = LOCALE_TO_LANGUAGE[expectedLocale] || expectedLocale.split('-')[0];
  const detection = detectLanguage(content);

  if (!detection.detectedLanguage) {
    return {
      isValid: true, // Can't determine, assume valid
      expectedLanguage,
      detectedLanguage: null,
      confidence: 0,
    };
  }

  const isValid = detection.detectedLanguage === expectedLanguage &&
                  detection.confidence >= minimumConfidence;

  if (!isValid) {
    return {
      isValid: false,
      expectedLanguage,
      detectedLanguage: detection.detectedLanguage,
      confidence: detection.confidence,
      warning: `⚠️ Inconsistencia de idioma: Se esperaba ${expectedLanguage.toUpperCase()} pero se detectó ${detection.detectedLanguage.toUpperCase()} (confianza: ${detection.confidence}%)`,
    };
  }

  return {
    isValid: true,
    expectedLanguage,
    detectedLanguage: detection.detectedLanguage,
    confidence: detection.confidence,
  };
}

/**
 * Analyze localization status of a document
 */
export function analyzeLocalizationStatus(
  document: any,
  requestedLocale?: string
): {
  documentId: string;
  currentLocale: string;
  isOwnTranslation: boolean;
  availableLocales: string[];
  inheritedFrom?: string;
  warning?: string;
} {
  const documentId = document.documentId || document.id;
  const currentLocale = document.locale || 'unknown';
  const localizations = document.localizations || [];

  // Get all available locales
  const availableLocales = [currentLocale, ...localizations.map((l: any) => l.locale)];

  // Check if this is the original or a localization
  const isOwnTranslation = !!(document.documentId || document.id);

  let warning: string | undefined;
  let inheritedFrom: string | undefined;

  // If a specific locale was requested but we got a different one
  if (requestedLocale && currentLocale !== requestedLocale) {
    // This might be a fallback
    inheritedFrom = currentLocale;
    warning = `⚠️ Locale solicitado "${requestedLocale}" no encontrado. Mostrando fallback desde "${currentLocale}". Puede que este contenido no tenga una traducción propia en "${requestedLocale}".`;
  }

  return {
    documentId,
    currentLocale,
    isOwnTranslation,
    availableLocales,
    inheritedFrom,
    warning,
  };
}

/**
 * Extract text fields from a document for language validation
 */
export function extractTextFields(data: any): Record<string, string> {
  const textFields: Record<string, string> = {};

  if (!data || typeof data !== 'object') {
    return textFields;
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 10) {
      // Only check substantial text fields
      textFields[key] = value;
    }
  }

  return textFields;
}

/**
 * Comprehensive validation of a document's language content
 */
export function validateDocumentLanguage(
  document: any,
  expectedLocale: string,
  options: {
    checkMixedLanguages?: boolean;
    minimumConfidence?: number;
    strictMode?: boolean;
  } = {}
): {
  isValid: boolean;
  locale: string;
  warnings: string[];
  details: {
    fieldValidations: Record<string, any>;
    mixedLanguageChecks: Record<string, any>;
    localizationStatus: any;
  };
} {
  const {
    checkMixedLanguages = true,
    minimumConfidence = 30,
    strictMode = false,
  } = options;

  const warnings: string[] = [];
  const fieldValidations: Record<string, any> = {};
  const mixedLanguageChecks: Record<string, any> = {};

  // Analyze localization status
  const localizationStatus = analyzeLocalizationStatus(document, expectedLocale);

  if (localizationStatus.warning) {
    warnings.push(localizationStatus.warning);

    // In strict mode, fail if we got a fallback
    if (strictMode && localizationStatus.inheritedFrom) {
      return {
        isValid: false,
        locale: localizationStatus.currentLocale,
        warnings: [
          ...warnings,
          `❌ MODO ESTRICTO: No se permite usar contenido heredado. El locale "${expectedLocale}" no tiene traducción propia.`,
        ],
        details: {
          fieldValidations,
          mixedLanguageChecks,
          localizationStatus,
        },
      };
    }
  }

  // Extract and validate text fields
  const textFields = extractTextFields(document);

  for (const [fieldName, fieldValue] of Object.entries(textFields)) {
    // Validate language
    const validation = validateContentLanguage(
      fieldValue,
      expectedLocale,
      minimumConfidence
    );

    fieldValidations[fieldName] = validation;

    if (!validation.isValid && validation.warning) {
      warnings.push(`Campo "${fieldName}": ${validation.warning}`);
    }

    // Check for mixed languages
    if (checkMixedLanguages) {
      const mixedCheck = detectMixedLanguages(fieldValue);
      mixedLanguageChecks[fieldName] = mixedCheck;

      if (mixedCheck.isMixed && mixedCheck.warning) {
        warnings.push(`Campo "${fieldName}": ${mixedCheck.warning}`);
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    locale: localizationStatus.currentLocale,
    warnings,
    details: {
      fieldValidations,
      mixedLanguageChecks,
      localizationStatus,
    },
  };
}

/**
 * Format validation results for display
 */
export function formatValidationResults(validation: ReturnType<typeof validateDocumentLanguage>): string {
  const lines: string[] = [];

  lines.push(`\n📋 Validación de Idioma:`);
  lines.push(`   Locale actual: ${validation.locale}`);
  lines.push(`   Estado: ${validation.isValid ? '✅ Válido' : '⚠️ Advertencias detectadas'}`);

  // Localization status
  const loc = validation.details.localizationStatus;
  lines.push(`\n🌐 Estado de Localización:`);
  lines.push(`   Traducción propia: ${loc.isOwnTranslation ? 'Sí' : 'No'}`);
  lines.push(`   Locales disponibles: ${loc.availableLocales.join(', ')}`);
  if (loc.inheritedFrom) {
    lines.push(`   ⚠️ Heredado desde: ${loc.inheritedFrom}`);
  }

  // Warnings
  if (validation.warnings.length > 0) {
    lines.push(`\n⚠️ Advertencias:`);
    validation.warnings.forEach(warning => {
      lines.push(`   ${warning}`);
    });
  }

  return lines.join('\n');
}
