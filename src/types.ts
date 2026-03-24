import { Timestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface ProjectVersion {
  id: string;
  timestamp: Timestamp | number;
  code: string;
  prompt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  outputLanguage?: string;
  scope?: string; // Action type (Explain, Debug, etc.)
  generatedCode?: string;
  userId?: string;
  createdAt: Timestamp | number;
  versions?: ProjectVersion[];
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
