// ─────────────────────────────────────────────────────────────────
// NATS Event Subject Constants
// ─────────────────────────────────────────────────────────────────

export const NoteEvents = {
  CREATED:             'note.created',
  UPDATED:             'note.updated',
  SHARED:              'note.shared',
  DELETED:             'note.deleted',
  COLLABORATOR_JOINED: 'note.collaborator.joined',
  COLLABORATOR_LEFT:   'note.collaborator.left',
  VERSION_CREATED:     'note.version.created',
} as const;

export const CommentEvents = {
  ADDED:    'comment.added',
  MENTIONED:'comment.mentioned',
  RESOLVED: 'comment.resolved',
  DELETED:  'comment.deleted',
} as const;

export const NotificationEvents = {
  CREATED: 'notification.created',
} as const;

export const UserEvents = {
  REGISTERED: 'user.registered',
  UPDATED:    'user.updated',
} as const;

// ─────────────────────────────────────────────────────────────────
// NATS Message Payload Types
// ─────────────────────────────────────────────────────────────────

export interface NoteCreatedPayload {
  noteId: string;
  ownerId: string;
  title: string;
  timestamp: string;
}

export interface NoteUpdatedPayload {
  noteId: string;
  authorId: string;
  content: string;   // TipTap JSON string
  timestamp: string;
  version: number;
}

export interface NoteSharedPayload {
  noteId: string;
  ownerId: string;
  sharedWithUserId: string;
  permission: 'EDITOR' | 'VIEWER';
}

export interface CollaboratorJoinedPayload {
  noteId: string;
  userId: string;
  displayName: string;
  timestamp: string;
}

export interface CollaboratorLeftPayload {
  noteId: string;
  userId: string;
  timestamp: string;
}

export interface CommentAddedPayload {
  commentId: string;
  threadId: string;
  noteId: string;
  authorId: string;
  content: string;
  mentions: string[];  // userIds
  timestamp: string;
}

export interface CommentResolvedPayload {
  threadId: string;
  noteId: string;
  resolvedById: string;
}

export interface NotificationCreatedPayload {
  userId: string;    // recipient
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  displayName: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────
// Shared Enum Types
// ─────────────────────────────────────────────────────────────────

export type NotePermission = 'OWNER' | 'EDITOR' | 'VIEWER';

export type NotificationType =
  | 'NOTE_SHARED'
  | 'COMMENT_ADDED'
  | 'MENTION'
  | 'COMMENT_RESOLVED'
  | 'NOTE_UPDATED';

// ─────────────────────────────────────────────────────────────────
// WebSocket Event Types (real-time via Socket.IO)
// ─────────────────────────────────────────────────────────────────

export const WsEvents = {
  // Client → Server
  JOIN_NOTE:        'join-note',
  LEAVE_NOTE:       'leave-note',
  DOC_UPDATE:       'doc-update',
  CURSOR_UPDATE:    'cursor-update',
  TYPING_START:     'typing-start',
  TYPING_STOP:      'typing-stop',

  // Server → Client
  DOC_SYNCED:       'doc-synced',
  COLLABORATOR_JOIN:'collaborator-joined',
  COLLABORATOR_LEFT:'collaborator-left',
  CURSOR_MOVED:     'cursor-moved',
  TYPING:           'typing',
  NOTIFICATION:     'notification',
  ERROR:            'ws-error',
} as const;
