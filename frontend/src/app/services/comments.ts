import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comment } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly API_URL = `${environment.apiUrl}/comments`;
  
  comments = signal<Comment[]>([]);

  constructor(private http: HttpClient) {}

  getComments(noteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/threads/${noteId}`).pipe(
      tap(threads => {
        // Map backend threads to simple comment structure for Phase 1 UI
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
        this.comments.set(mappedComments);
      })
    );
  }

  addComment(noteId: string, content: string, position: string = 'root'): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/threads`, { noteId, anchorId: position, content }).pipe(
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
}
