import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private socket!: Socket;
  
  // Real-time state
  activeUsers = signal<{ userId: string; cursor?: { line: number; ch: number } }[]>([]);
  documentChanges = signal<any>(null);

  constructor(private authService: AuthService) {}

  connect(noteId: string) {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(environment.wsUrl + '/collab', {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to collaboration service');
      this.socket.emit('join-note', { noteId }, (response: any) => {
        if (response && response.collaborators) {
          this.activeUsers.set(response.collaborators.map((c: any) => ({ userId: c.userId })));
        }
        if (response && response.docState) {
          this.documentChanges.set(response.docState);
        }
      });
    });

    this.socket.on('doc-synced', (data: { content: string; authorId: string; timestamp: string }) => {
      // Received a document update from someone else
      this.documentChanges.set(data.content);
    });

    this.socket.on('cursor-moved', (data: { userId: string; position: any }) => {
      this.activeUsers.update(users => {
        const existing = users.find(u => u.userId === data.userId);
        if (existing) {
          existing.cursor = data.position;
          return [...users];
        } else {
          return [...users, { userId: data.userId, cursor: data.position }];
        }
      });
    });

    this.socket.on('collaborator-joined', (data: { userId: string }) => {
      this.activeUsers.update(users => [...users.filter(u => u.userId !== data.userId), { userId: data.userId }]);
    });

    this.socket.on('collaborator-left', (data: { userId: string }) => {
      this.activeUsers.update(users => users.filter(u => u.userId !== data.userId));
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
    }
    this.activeUsers.set([]);
    this.documentChanges.set(null);
  }
}
