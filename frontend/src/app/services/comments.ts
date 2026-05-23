import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, interval, switchMap, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comment } from '../models';
import { UsersService } from './users';
import { CollaborationService } from './collaboration';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly API_URL = `${environment.apiUrl}/comments`;
  private usersService = inject(UsersService);
  
  comments = signal<Comment[]>([]);
  private pollingSub?: Subscription;

  constructor(private http: HttpClient, private collabService: CollaborationService) {
    this.collabService.commentUpdates.subscribe((data) => {
      // Whenever a comment is added, resolved, updated, or deleted,
      // and we have an active note matching the event, we fetch fresh comments
      if (data.noteId) {
        // Just refetch all comments for the current note by re-triggering the fetch
        const currentComments = this.comments();
        if (currentComments.length > 0 && currentComments[0].noteId === data.noteId) {
          this.http.get<any[]>(`${this.API_URL}/threads/${data.noteId}`)
            .subscribe(threads => this.updateCommentsState(threads));
        }
      }
    });
  }

  getComments(noteId: string): Observable<any[]> {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    
    // Start polling every 5 seconds
    this.pollingSub = interval(5000).pipe(
      switchMap(() => this.http.get<any[]>(`${this.API_URL}/threads/${noteId}`))
    ).subscribe(threads => this.updateCommentsState(threads));

    return this.http.get<any[]>(`${this.API_URL}/threads/${noteId}`).pipe(
      tap(threads => this.updateCommentsState(threads))
    );
  }

  private updateCommentsState(threads: any[]) {
    const mappedComments = threads.map(t => {
      const firstComment = t.comments[0] || {};
      return {
        id: t.id,
        noteId: t.noteId,
        userId: firstComment.authorId || 'unknown',
        content: firstComment.content || '',
        resolved: t.status === 'RESOLVED',
        createdAt: t.createdAt
      };
    });
    
    // Only update if there's a difference or just update directly (signal will handle it)
    this.comments.set(mappedComments);

        // Fetch emails in background
    mappedComments.forEach(comment => {
      if (comment.userId !== 'unknown') {
        this.usersService.getUserById(comment.userId).subscribe({
          next: (u) => {
            if (u && u.email) {
              this.comments.update(curr => 
                curr.map(c => c.id === comment.id ? { ...c, email: u.email } : c)
              );
            }
          },
          error: () => {}
        });
      }
    });
  }
  addComment(noteId: string, content: string, position: string = 'root', mentions: string[] = []): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/threads`, { noteId, anchorId: position, content, mentions }).pipe(
      tap(thread => {
        const firstComment = thread.comments && thread.comments[0] ? thread.comments[0] : { content };
        const newComment = {
          id: thread.id,
          noteId: thread.noteId,
          userId: firstComment.authorId || 'unknown',
          content: firstComment.content || content,
          resolved: thread.status === 'RESOLVED',
          createdAt: thread.createdAt || new Date().toISOString()
        };
        this.comments.update(comments => [...comments, newComment]);
        this.updateCommentsState([thread, ...this.comments()]); // Re-fetch email bg
      })
    );
  }

  resolveComment(threadId: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/threads/${threadId}/resolve`, {}).pipe(
      tap(() => {
        this.comments.update(comments => 
          comments.map(c => c.id === threadId ? { ...c, resolved: true } : c)
        );
      })
    );
  }

  updateComment(threadId: string, content: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/threads/${threadId}`, { content }).pipe(
      tap(() => {
        this.comments.update(comments => 
          comments.map(c => c.id === threadId ? { ...c, content } : c)
        );
      })
    );
  }

  deleteComment(threadId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/threads/${threadId}`).pipe(
      tap(() => {
        this.comments.update(comments => comments.filter(c => c.id !== threadId));
      })
    );
  }
}
