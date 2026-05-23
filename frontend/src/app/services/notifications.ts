import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, interval, switchMap, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models';
import { UsersService } from './users';
import { CollaborationService } from './collaboration';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private usersService = inject(UsersService);
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  private pollingSub?: Subscription;

  constructor(private http: HttpClient, private collabService: CollaborationService) {
    this.startPolling();
    this.collabService.globalNotifications.subscribe(() => {
      // Fetch latest notifications immediately when a push event comes in
      this.getNotifications().subscribe();
    });
  }

  startPolling() {
    this.getNotifications().subscribe();
    this.pollingSub = interval(5000).pipe(
      switchMap(() => this.getNotifications())
    ).subscribe();
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map(notifs => notifs.map(n => this.formatNotification(n))),
      tap(notifs => {
        this.notifications.set(notifs);
        this.unreadCount.set(notifs.filter(n => !n.read).length);
        
        // Background fetch user details to replace ID with email
        notifs.forEach(n => {
          const uId = n.sourceUserId;
          if (uId) {
            this.usersService.getUserById(uId).subscribe(user => {
              if (user && user.email) {
                this.notifications.update(currentNotifs => 
                  currentNotifs.map(cn => {
                    if (cn.id === n.id) {
                      const emailPrefix = user.email.split('@')[0];
                      let newMessage = cn.message;
                      // Replace the known "User X" placeholder with the actual email
                      newMessage = newMessage.replace(`User ${uId.substring(0,4)}`, emailPrefix);
                      newMessage = newMessage.replace(`user ${uId.substring(0,4)}`, emailPrefix);
                      return { ...cn, message: newMessage };
                    }
                    return cn;
                  })
                );
              }
            });
          }
        });
      })
    );
  }

  private formatNotification(n: any): Notification & { sourceUserId?: string } {
    let title = 'New Notification';
    let message = 'You have a new activity.';
    const p = n.payload || {};
    let sourceUserId: string | undefined;

    switch (n.type) {
      case 'NOTE_SHARED':
        title = 'Note Shared';
        sourceUserId = p.sourceUserId || p.ownerId;
        message = `User ${sourceUserId?.substring(0,4) || 'unknown'} shared note ${p.noteId?.substring(0,4)} with you.`;
        break;
      case 'COMMENT_ADDED':
        title = 'New Comment';
        sourceUserId = p.sourceUserId || p.authorId;
        message = `User ${sourceUserId?.substring(0,4) || 'unknown'} added a comment to note ${p.noteId?.substring(0,4)}.`;
        break;
      case 'MENTION':
        title = 'You were Mentioned';
        sourceUserId = p.sourceUserId || p.authorId;
        message = `User ${sourceUserId?.substring(0,4) || 'unknown'} mentioned you in a comment.`;
        break;
      case 'COMMENT_RESOLVED':
        title = 'Comment Resolved';
        sourceUserId = p.sourceUserId || p.resolvedById;
        message = `A comment thread in note ${p.noteId?.substring(0,4)} was resolved.`;
        break;
      case 'NOTE_UPDATED':
        title = 'Note Updated';
        sourceUserId = p.sourceUserId || p.authorId;
        message = `Note ${p.noteId?.substring(0,4)} was updated by user ${sourceUserId?.substring(0,4) || 'unknown'}.`;
        break;
    }

    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title,
      message,
      read: n.read,
      createdAt: n.createdAt,
      sourceUserId
    } as Notification & { sourceUserId?: string };
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
