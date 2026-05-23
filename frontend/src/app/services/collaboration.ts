import { Injectable, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import { UsersService } from './users';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private socket!: Socket;
  private usersService = inject(UsersService);
  
  // Real-time state
  activeUsers = signal<{ userId: string; email?: string; cursor?: { line: number; ch: number } }[]>([]);
  documentChanges = signal<any>(null);
  
  // Real-time events
  globalNotifications = new Subject<any>();
  commentUpdates = new Subject<any>();

  constructor(private authService: AuthService) {
    this.initGlobalConnection();
  }

  initGlobalConnection() {
    const token = this.authService.getToken();
    if (!token) return;

    if (!this.socket) {
      this.socket = io(environment.wsUrl + '/collab', {
        auth: { token },
        transports: ['websocket']
      });

      this.socket.on('notification', (data) => {
        this.globalNotifications.next(data);
      });

      this.socket.on('comment-updated', (data) => {
        this.commentUpdates.next(data);
      });
    }
  }

  connect(noteId: string) {
    this.initGlobalConnection();

    if (this.socket.connected) {
      this.joinNoteRoom(noteId);
    } else {
      this.socket.on('connect', () => {
        console.log('Connected to collaboration service');
        this.joinNoteRoom(noteId);
      });
    }
  }

  private joinNoteRoom(noteId: string) {
    this.socket.emit('join-note', { noteId }, (response: any) => {
      if (response && response.collaborators) {
        response.collaborators.forEach((c: any) => this.addUserPresence(c.userId));
      }
      if (response && response.docState) {
        this.documentChanges.set(response.docState);
      }
    });

    // Remove existing listeners to avoid duplicates if re-connecting
    this.socket.off('doc-synced');
    this.socket.off('cursor-moved');
    this.socket.off('collaborator-joined');
    this.socket.off('collaborator-left');

    this.socket.on('doc-synced', (data: { content: string; authorId: string; timestamp: string }) => {
      this.documentChanges.set(data.content);
    });

    this.socket.on('cursor-moved', (data: { userId: string; position: any }) => {
      this.activeUsers.update(users => {
        const existing = users.find(u => u.userId === data.userId);
        if (existing) {
          existing.cursor = data.position;
          return [...users];
        } else {
          this.addUserPresence(data.userId);
          return [...users, { userId: data.userId, cursor: data.position }];
        }
      });
    });

    this.socket.on('collaborator-joined', (data: { userId: string }) => {
      this.addUserPresence(data.userId);
    });

    this.socket.on('collaborator-left', (data: { userId: string }) => {
      this.activeUsers.update(users => users.filter(u => u.userId !== data.userId));
    });
  }

  private addUserPresence(userId: string) {
    this.activeUsers.update(users => {
      if (users.some(u => u.userId === userId)) return users;
      return [...users, { userId }];
    });
    this.usersService.getUserById(userId).subscribe({
      next: (user) => {
        this.activeUsers.update(users => 
          users.map(u => u.userId === userId ? { ...u, email: user.email } : u)
        );
      }
    });
  }

  sendUpdate(noteId: string, content: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('doc-update', { noteId, content });
    }
  }

  sendCursor(noteId: string, position: { line: number; ch: number }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('cursor-update', { noteId, position });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      (this.socket as any) = undefined;
    }
    this.activeUsers.set([]);
    this.documentChanges.set(null);
  }
}
