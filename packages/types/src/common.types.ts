/** Shapes shared by every module. Mirrors the backend's shared/pagination.py. */

export type ISODateTime = string;
export type ISODate = string;
export type UUID = string;

/** 64-character lowercase hex. Rendered only through <RecordHash />. */
export type Sha256Hex = string;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface PageQuery {
  page?: number;
  page_size?: number;
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** Error envelope produced by core/middleware/error_handler.py. */
export interface ApiErrorBody {
  code: string;
  message: string;
  /** Field-level validation errors, keyed by form field name. */
  details?: Record<string, string[]>;
  request_id?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  geo?: GeoPoint;
}
