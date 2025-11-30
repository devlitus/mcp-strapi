/**
 * Strapi API Types
 */

export interface StrapiEntity {
  id: number;
  [key: string]: any;
}

export interface StrapiResponse<T = any> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiListResponse<T = any> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: any;
}

/**
 * MCP Tool Parameters
 */

export interface CreateParams {
  contentType: string;
  data: Record<string, any>;
  populate?: string[];
  locale?: string;
}

export interface ReadParams {
  contentType: string;
  documentId: string;
  fields?: string[];
  populate?: string[];
  locale?: string;
}

export interface ListParams {
  contentType: string;
  filters?: Record<string, any>;
  sort?: string[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  fields?: string[];
  populate?: string[];
  locale?: string;
}

export interface UpdateParams {
  contentType: string;
  documentId: string;
  data: Record<string, any>;
  populate?: string[];
  locale?: string;
}

export interface DeleteParams {
  contentType: string;
  documentId: string;
}

/**
 * Query Parameters for Strapi API
 */

export interface QueryParams {
  fields?: string[];
  populate?: string[] | string;
  filters?: Record<string, any>;
  sort?: string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  publicationState?: "live" | "preview";
  locale?: string;
}
