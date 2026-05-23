export interface User {
  id: string;
  email: string;
  displayName?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface Note {
  id: string;
  title: string;
  content: any; // Can be string or JSON structure depending on editor
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  noteId: string;
  userId: string;
  role: 'VIEWER' | 'EDITOR' | 'OWNER';
}

export interface Comment {
  id: string;
  noteId: string;
  userId: string;
  email?: string;
  content: string;
  position?: string;
  resolved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  sourceUserId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
