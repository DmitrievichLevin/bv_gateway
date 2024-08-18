/**
 * Mongoose validateSync Error
 */
export type SyncValidationError = {
  errors: { [key: string]: { message: string } };
};

/**
 * Successfully Saved Mongo Document.
 */
export type SavedDocument = { id: string; [key: string]: any };

/**
 * User Document
 */
export type UserDocument = SavedDocument;

/**
 * Deserialized Multipart Request Properties
 * - Includes original request properties
 */
export type MultipartRequestProperties = {
  body: {
    raw?: BinaryType;
    user: { id: string; [key: string]: any };
    // Deserialized multipart/form-data properties
    fileSum: number;
    __media: {
      image: boolean;
      video: boolean;
      file: boolean;
      images: number;
      videos: number;
      files: number;
    };
  };
  // Original request properties
} & Express.Request;

/**
 * Stream Response Content Interface
 */
export interface StreamResponseContent<T> {
  progress: number;
  message?: string;
  length?: number;
  data?: T;
  error?: Error | string;
}

export type StreamResponseOptions = {
  failFast?: boolean;
};

/**
 * Media Microservice Response
 */
export type MediaResponse = {
  url: string;
  thumbnail: string;
  id: string;
  metadata: {
    parent: string;
    parentId: string;
    owner: string;
    path: string;
    mime: string;
    type: string;
    created_at: number;
    size: number;
  };
};

/**
 * Media Microservice Callback
 */
export type MediaMicroserviceCallback<T> = (micro_response: {
  data: MediaResponse[];
}) => T;

/**
 * Media Microservice Failure Callback
 */
export type MediaMicroserviceFallback<T> = (err: Error) => T;

export type SettledMediaPromise = {
  status: 'fulfilled' | 'rejected';
  value?: MediaResponse | null;
  reason?: any;
};

export type MediaGetResponse = {
  data?: MediaResponse[];
};
