import { environment } from "../config/environment.js";
import type {
  StrapiResponse,
  StrapiListResponse,
  QueryParams,
  CreateParams,
  ReadParams,
  ListParams,
  UpdateParams,
  DeleteParams,
} from "../types/index.js";

/**
 * Strapi API Client using native fetch
 */
export class StrapiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || environment.strapiUrl;
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.fields && params.fields.length > 0) {
      params.fields.forEach((field) => {
        searchParams.append("fields[]", field);
      });
    }

    if (params.populate) {
      if (Array.isArray(params.populate)) {
        params.populate.forEach((pop) => {
          searchParams.append("populate[]", pop);
        });
      } else {
        searchParams.append("populate", params.populate);
      }
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.append(`filters[${key}]`, JSON.stringify(value));
      });
    }

    if (params.sort && params.sort.length > 0) {
      params.sort.forEach((sortField) => {
        searchParams.append("sort[]", sortField);
      });
    }

    if (params.pagination) {
      if (params.pagination.page !== undefined) {
        searchParams.append(
          "pagination[page]",
          params.pagination.page.toString()
        );
      }
      if (params.pagination.pageSize !== undefined) {
        searchParams.append(
          "pagination[pageSize]",
          params.pagination.pageSize.toString()
        );
      }
      if (params.pagination.start !== undefined) {
        searchParams.append(
          "pagination[start]",
          params.pagination.start.toString()
        );
      }
      if (params.pagination.limit !== undefined) {
        searchParams.append(
          "pagination[limit]",
          params.pagination.limit.toString()
        );
      }
    }

    if (params.publicationState) {
      searchParams.append("publicationState", params.publicationState);
    }

    if (params.locale) {
      searchParams.append("locale", params.locale);
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if API token is available
    if (environment.strapiApiToken) {
      headers["Authorization"] = `Bearer ${environment.strapiApiToken}`;
    }

    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          // If error is not JSON, use the text
          if (errorText) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[STRAPI CLIENT ERROR] ${error.message}`);
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }

  /**
   * Create a new entry
   */
  async create(params: CreateParams): Promise<StrapiResponse> {
    const { contentType, data, populate, locale } = params;
    const queryParams: QueryParams = {};

    if (populate) {
      queryParams.populate = populate;
    }

    if (locale) {
      queryParams.locale = locale;
    }

    const queryString = this.buildQueryString(queryParams);
    const endpoint = `/api/${contentType}${queryString}`;

    console.error(
      `[STRAPI CLIENT] Creating entry in ${contentType}${
        locale ? ` (locale: ${locale})` : ""
      }`
    );

    return this.request<StrapiResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify({ data }),
    });
  }

  /**
   * Read a single entry by documentId
   */
  async read(params: ReadParams): Promise<StrapiResponse> {
    const { contentType, documentId, fields, populate } = params;
    const queryParams: QueryParams = {};

    if (fields) {
      queryParams.fields = fields;
    }
    if (populate) {
      queryParams.populate = populate;
    }

    const queryString = this.buildQueryString(queryParams);
    const endpoint = `/api/${contentType}/${documentId}${queryString}`;

    console.error(
      `[STRAPI CLIENT] Reading entry ${documentId} from ${contentType}`
    );

    return this.request<StrapiResponse>(endpoint, {
      method: "GET",
    });
  }

  /**
   * List entries with filters, pagination, and sorting
   */
  async list(params: ListParams): Promise<StrapiListResponse> {
    const { contentType, filters, sort, pagination, fields, populate } = params;
    const queryParams: QueryParams = {};

    if (fields) {
      queryParams.fields = fields;
    }
    if (populate) {
      queryParams.populate = populate;
    }
    if (filters) {
      queryParams.filters = filters;
    }
    if (sort) {
      queryParams.sort = sort;
    }
    if (pagination) {
      queryParams.pagination = pagination;
    }

    const queryString = this.buildQueryString(queryParams);
    const endpoint = `/api/${contentType}${queryString}`;

    console.error(`[STRAPI CLIENT] Listing entries from ${contentType}`);

    return this.request<StrapiListResponse>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Update an existing entry by documentId
   */
  async update(params: UpdateParams): Promise<StrapiResponse> {
    const { contentType, documentId, data, populate, locale } = params;
    const queryParams: QueryParams = {};

    if (populate) {
      queryParams.populate = populate;
    }

    if (locale) {
      queryParams.locale = locale;
    }

    const queryString = this.buildQueryString(queryParams);
    const endpoint = `/api/${contentType}/${documentId}${queryString}`;

    console.error(
      `[STRAPI CLIENT] Updating entry ${documentId} in ${contentType}${
        locale ? ` (locale: ${locale})` : ""
      }`
    );

    return this.request<StrapiResponse>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
  }

  /**
   * Delete an entry by documentId
   */
  async delete(params: DeleteParams): Promise<StrapiResponse> {
    const { contentType, documentId } = params;
    const endpoint = `/api/${contentType}/${documentId}`;

    console.error(
      `[STRAPI CLIENT] Deleting entry ${documentId} from ${contentType}`
    );

    return this.request<StrapiResponse>(endpoint, {
      method: "DELETE",
    });
  }

  /**
   * Get all content types
   */
  async getContentTypes(): Promise<any> {
    console.error("[STRAPI CLIENT] Fetching content types");

    return this.request<any>("/api/content-type-builder/content-types", {
      method: "GET",
    });
  }

  /**
   * Get a specific content type schema
   */
  async getContentType(uid: string): Promise<any> {
    console.error(`[STRAPI CLIENT] Fetching content type: ${uid}`);

    return this.request<any>(`/api/content-type-builder/content-types/${uid}`, {
      method: "GET",
    });
  }

  /**
   * Add field to content type
   */
  async addFieldToContentType(params: {
    contentType: string;
    fieldName: string;
    fieldType: string;
    options?: Record<string, any>;
  }): Promise<any> {
    const { contentType, fieldName, fieldType, options = {} } = params;

    console.error(
      `[STRAPI CLIENT] Adding field ${fieldName} (${fieldType}) to ${contentType}`
    );

    // Get current content type schema
    const currentSchema = await this.getContentType(contentType);

    // Build the new attribute
    const attribute: Record<string, any> = {
      type: fieldType,
      ...options,
    };

    // Update the schema with the new field
    const updatedSchema = {
      ...currentSchema.data.schema,
      attributes: {
        ...currentSchema.data.schema.attributes,
        [fieldName]: attribute,
      },
    };

    return this.request<any>(
      `/api/content-type-builder/content-types/${contentType}`,
      {
        method: "PUT",
        body: JSON.stringify({
          contentType: updatedSchema,
          components: [],
        }),
      }
    );
  }

  /**
   * Get all i18n locales
   */
  async getI18nLocales(): Promise<any> {
    console.error("[STRAPI CLIENT] Fetching i18n locales");

    return this.request<any>("/api/i18n/locales", {
      method: "GET",
    });
  }

  /**
   * Search media files in the upload library
   */
  async searchMedia(params: {
    search?: string;
    mime?: string;
    pagination?: { page?: number; pageSize?: number };
    sort?: string[];
  }): Promise<any> {
    const queryParams = new URLSearchParams();

    if (params.search) {
      queryParams.append("filters[$or][0][name][$contains]", params.search);
      queryParams.append("filters[$or][1][alternativeText][$contains]", params.search);
    }

    if (params.mime) {
      queryParams.append("filters[mime][$contains]", params.mime);
    }

    if (params.pagination) {
      if (params.pagination.page !== undefined) {
        queryParams.append("pagination[page]", params.pagination.page.toString());
      }
      if (params.pagination.pageSize !== undefined) {
        queryParams.append("pagination[pageSize]", params.pagination.pageSize.toString());
      }
    }

    if (params.sort && params.sort.length > 0) {
      params.sort.forEach((sortField) => {
        queryParams.append("sort[]", sortField);
      });
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const endpoint = `/api/upload/files${queryString}`;

    console.error("[STRAPI CLIENT] Searching media files");

    return this.request<any>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get a specific media file by ID or documentId
   */
  async getMedia(id: string | number): Promise<any> {
    const endpoint = `/api/upload/files/${id}`;

    console.error(`[STRAPI CLIENT] Fetching media file with ID: ${id}`);

    return this.request<any>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Upload a media file to Strapi
   */
  async uploadMedia(params: {
    filePath: string;
    alternativeText?: string;
    caption?: string;
    name?: string;
    folder?: string;
  }): Promise<any> {
    const { filePath, alternativeText, caption, name, folder } = params;

    // Import fs dynamically to read the file
    const fs = await import("fs");
    const path = await import("path");

    console.error(`[STRAPI CLIENT] Uploading file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = name || path.basename(filePath);

    // Create FormData
    const formData = new FormData();

    // Create a Blob from the buffer
    const blob = new Blob([fileBuffer]);

    // Append file to FormData
    formData.append("files", blob, fileName);

    // Add optional metadata
    if (alternativeText || caption) {
      const fileInfo: any = {};
      if (alternativeText) fileInfo.alternativeText = alternativeText;
      if (caption) fileInfo.caption = caption;
      if (name) fileInfo.name = name;

      formData.append("fileInfo", JSON.stringify(fileInfo));
    }

    if (folder) {
      formData.append("folder", folder);
    }

    const url = `${this.baseUrl}/api/upload`;
    const headers: Record<string, string> = {};

    // Add authorization header if API token is available
    if (environment.strapiApiToken) {
      headers["Authorization"] = `Bearer ${environment.strapiApiToken}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as any;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[STRAPI CLIENT ERROR] ${error.message}`);
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }
}

// Export singleton instance
export const strapiClient = new StrapiClient();
