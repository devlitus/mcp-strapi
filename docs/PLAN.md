# Plan: MCP Server para CRUD de Content Types de Strapi

## Resumen
Crear un servidor Model Context Protocol (MCP) en TypeScript que proporcione operaciones CRUD completas para los content types de Strapi, ejecutándose en un contenedor Docker.

**IMPORTANTE**: Este plan debe copiarse a la carpeta `docs/PLAN.md` al iniciar la implementación para referencia futura.

## Arquitectura Propuesta

### 1. Stack Tecnológico
- **Lenguaje**: TypeScript
- **SDK**: @modelcontextprotocol/sdk (oficial)
- **Runtime**: Node.js 22+ (LTS)
- **Validación**: Zod para schemas
- **HTTP Client**: Fetch nativo (incluido en Node.js 22+)
- **Transport**: Stdio (StdioServerTransport)
- **Contenedor**: Docker con multi-stage build

### 2. Estructura del Proyecto

```
mcp-strapi/
├── docs/                        # Documentación del proyecto
│   └── PLAN.md                 # Copia de este plan para referencia
├── src/
│   ├── index.ts                 # Entry point y configuración del servidor
│   ├── server.ts                # Configuración del MCP server
│   ├── tools/                   # Implementación de herramientas CRUD
│   │   ├── create.ts           # Tool para crear entradas
│   │   ├── read.ts             # Tool para leer entradas
│   │   ├── update.ts           # Tool para actualizar entradas
│   │   ├── delete.ts           # Tool para eliminar entradas
│   │   └── list.ts             # Tool para listar entradas
│   ├── services/               # Servicios de integración
│   │   └── strapi-client.ts   # Cliente HTTP para Strapi API (usando fetch nativo)
│   ├── types/                  # Definiciones de tipos TypeScript
│   │   └── index.ts
│   └── config/                 # Configuración
│       └── environment.ts      # Variables de entorno
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml          # Orquestación (solo MCP)
├── .dockerignore
├── .env.example                # Template de variables de entorno
├── package.json
├── tsconfig.json
└── README.md
```

### 3. Herramientas (Tools) del MCP

#### 3.1 `strapi-create`
**Descripción**: Crea una nueva entrada en un content type de Strapi
**Schema de entrada**:
```typescript
{
  contentType: string,    // UID del content type (ej: 'api::article.article')
  data: object,          // Datos de la entrada
  populate?: string[]    // Relaciones a poblar (opcional)
}
```

#### 3.2 `strapi-read`
**Descripción**: Lee una entrada específica por ID
**Schema de entrada**:
```typescript
{
  contentType: string,
  id: number,
  fields?: string[],
  populate?: string[]
}
```

#### 3.3 `strapi-list`
**Descripción**: Lista entradas con filtrado, paginación y ordenamiento
**Schema de entrada**:
```typescript
{
  contentType: string,
  filters?: object,
  sort?: string[],
  pagination?: { page: number, pageSize: number },
  fields?: string[],
  populate?: string[]
}
```

#### 3.4 `strapi-update`
**Descripción**: Actualiza una entrada existente
**Schema de entrada**:
```typescript
{
  contentType: string,
  id: number,
  data: object,
  populate?: string[]
}
```

#### 3.5 `strapi-delete`
**Descripción**: Elimina una entrada
**Schema de entrada**:
```typescript
{
  contentType: string,
  id: number
}
```

#### 3.6 `strapi-content-types` (Bonus)
**Descripción**: Lista todos los content types disponibles en Strapi
**Schema de entrada**: Ninguno

### 4. Configuración y Variables de Entorno

```env
# Strapi Configuration
STRAPI_URL=http://localhost:1337

# MCP Server Configuration
NODE_ENV=production
```

**Nota**: Sin autenticación en esta primera iteración. Se añadirá API Token en iteración futura.

### 5. Características de Seguridad y Validación

1. **Validación de Schemas**: Usar Zod para validar todas las entradas y tipos dinámicos
2. **Manejo de Errores**: Try-catch completo con mensajes descriptivos
3. **Autenticación Strapi**: Sin autenticación en v1 (se agregará en v2)
4. **Validación de Content Types**: Verificar que el contentType sea válido antes de operar

### 6. Docker Configuration

#### Dockerfile (Multi-stage)
- **Stage 1 (builder)**: Compilar TypeScript
- **Stage 2 (production)**: Imagen ligera con solo runtime
- Base: `node:22-alpine` (Node.js 22+ requerido)
- Usuario no-root para seguridad
- Entry point configurable para stdio transport

#### Docker Compose
- **Solo servicio MCP server** (Strapi corre externamente)
- Network mode: host (para acceder a localhost:1337)
- Variables de entorno para STRAPI_URL
- Sin volúmenes necesarios (stateless)

### 7. Mejores Prácticas Implementadas

✅ **Según documentación de MCP TypeScript SDK**:
- Usar `McpServer` de alto nivel con manejo automático de protocolo
- Implementar validación de schemas con Zod (crucial para content types dinámicos)
- **Stdio transport** para uso local (StdioServerTransport)
- Manejo de errores con `isError: true`
- Structured content + text content en respuestas
- Sin gestión de sesiones (stateless - recomendado)

✅ **Según documentación de Strapi**:
- Usar Entity Service API endpoints
- Implementar populate correctamente
- Soportar filtros, paginación y ordenamiento
- Manejo de publicationState

✅ **Mejores prácticas generales**:
- TypeScript strict mode
- Separación de responsabilidades (tools, services, config)
- Logging apropiado
- Health check endpoint
- Documentación clara en README

## Decisiones Tomadas (Respuestas del Usuario)

1. ✅ **Strapi existente**: Ya existe una instancia de Strapi corriendo externamente. NO incluir Strapi en docker.

2. ✅ **Autenticación**: Sin autenticación en v1 (implementación más simple). API Token se agregará en iteración futura.

3. ✅ **Transport**: Stdio (StdioServerTransport) para uso local.

4. ✅ **Content Types**: Sistema completamente genérico. El content type y sus propiedades se pasan como argumentos en cada llamada.

## Archivos Críticos a Crear

1. `docs/PLAN.md` - **Copia de este plan para referencia permanente**
2. `src/index.ts` - Entry point con StdioServerTransport
3. `src/server.ts` - Configuración del McpServer y registro de tools
4. `src/tools/*.ts` - Implementación de cada herramienta CRUD (5 archivos)
5. `src/services/strapi-client.ts` - Cliente HTTP reutilizable usando **fetch nativo** (sin auth)
6. `src/types/index.ts` - Tipos TypeScript compartidos
7. `src/config/environment.ts` - Configuración de variables de entorno
8. `Dockerfile` - Multi-stage build optimizado para stdio
9. `docker-compose.yml` - Configuración simple (solo MCP)
10. `package.json` - Dependencias (SDK, zod, dotenv - **sin axios**)
11. `tsconfig.json` - Configuración TypeScript strict
12. `README.md` - Documentación de uso con ejemplos
13. `.env.example` - Template de variables de entorno

## Implementación Paso a Paso

### Fase 1: Configuración Base
1. Crear `package.json` con dependencias:
   - @modelcontextprotocol/sdk
   - zod
   - dotenv
   - **Nota**: Requiere Node.js 22+ para fetch nativo, sin axios
   - **engines**: "node": ">=22.0.0"
2. Configurar `tsconfig.json` con strict mode
3. Crear estructura de directorios incluyendo `docs/` para documentación del plan

### Fase 2: Core del MCP Server
1. Implementar `src/index.ts` con StdioServerTransport
2. Crear `src/server.ts` con configuración del McpServer
3. Configurar `src/config/environment.ts` para STRAPI_URL

### Fase 3: Cliente de Strapi
1. Implementar `src/services/strapi-client.ts`:
   - Usar **fetch nativo** (disponible en Node.js 22+)
   - Métodos para cada operación CRUD
   - Manejo de errores HTTP con try-catch
   - Tipado genérico para content types
   - Headers: 'Content-Type': 'application/json'

### Fase 4: Herramientas CRUD
Implementar cada tool en `src/tools/`:
1. **create.ts**: Validación con Zod, llamada a Strapi, respuesta estructurada
2. **read.ts**: Validación de ID, manejo de 404
3. **list.ts**: Soporte para filtros, paginación, sort
4. **update.ts**: Validación parcial de datos
5. **delete.ts**: Confirmación de eliminación

### Fase 5: Dockerización
1. Crear `Dockerfile` multi-stage:
   - Build stage: compilar TS con node:22-alpine
   - Runtime stage: node:22-alpine
   - ENTRYPOINT para ejecutar el servidor
   - Verificación de versión de Node.js
2. Crear `docker-compose.yml`:
   - Network mode: host
   - Variable STRAPI_URL

### Fase 6: Documentación
1. README.md con:
   - Instrucciones de instalación
   - Ejemplos de uso de cada tool
   - Configuración de Claude Desktop
   - Roadmap (v2 con API tokens)

## Consideraciones Técnicas Adicionales

### Uso de Fetch Nativo
- **Node.js 22+** incluye fetch nativo (global) de forma estable
- No requiere dependencias adicionales como axios
- Manejo de errores con try-catch y verificación de response.ok
- Ejemplo básico:
```typescript
const response = await fetch(`${STRAPI_URL}/api/${contentType}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data })
});
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}
const result = await response.json();
```

### Manejo de Content Types Dinámicos
Como el sistema es genérico, cada tool acepta el `contentType` como string (ej: 'api::article.article'). No se validan los campos específicos del content type, permitiendo máxima flexibilidad.

### Configuración para Claude Desktop
El README incluirá la configuración JSON para agregar el servidor a Claude Desktop:
```json
{
  "mcpServers": {
    "strapi": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--network=host", "mcp-strapi"]
    }
  }
}
```

### Logging
Implementar logging a stderr (stdout reservado para MCP protocol) para debugging sin interferir con el protocolo.

## Roadmap Futuro (v2)
- Autenticación con API Tokens de Strapi
- Validación de schemas contra Strapi Content-Type definitions
- Caché de content types disponibles
- Soporte para operaciones en batch
- Streamable HTTP transport como opción
