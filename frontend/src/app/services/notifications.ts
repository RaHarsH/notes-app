import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map(notifs => notifs.map(n => this.formatNotification(n))),
      tap(notifs => {
        this.notifications.set(notifs);
        this.unreadCount.set(notifs.filter(n => !n.read).length);
      })
    );
  }

  private formatNotification(n: any): Notification {
    let title = 'New Notification';
    let message = 'You have a new activity.';
    const p = n.payload || {};

    switch (n.type) {
      case 'NOTE_SHARED':
        title = 'Note Shared';
        message = `User ${p.ownerId?.substring(0,4)} shared note ${p.noteId?.substring(0,4)} with you.`;
        break;
      case 'COMMENT_ADDED':
        title = 'New Comment';
        message = `User ${p.authorId?.substring(0,4)} added a comment to note ${p.noteId?.substring(0,4)}.`;
        break;
      case 'MENTION':
        title = 'You were Mentioned';
        message = `User ${p.authorId?.substring(0,4)} mentioned you in a comment.`;
        break;
      case 'COMMENT_RESOLVED':
        title = 'Comment Resolved';
        message = `A comment thread in note ${p.noteId?.substring(0,4)} was resolved.`;
        break;
      case 'NOTE_UPDATED':
        title = 'Note Updated';
        message = `Note ${p.noteId?.substring(0,4)} was updated by user ${p.authorId?.substring(0,4)}.`;
        break;
    }

    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title,
      message,
      read: n.read,
      createdAt: n.createdAt
    };
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(notifs => 
          notifs.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(notifs => 
          notifs.map(n => ({ ...n, read: true }))
        );
        this.unreadCount.set(0);
      })
    );
  }
}
