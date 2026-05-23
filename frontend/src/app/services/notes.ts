import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Note } from '../models';
import { CollaborationService } from './collaboration';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly API_URL = `${environment.apiUrl}/notes`;
  
  notes = signal<Note[]>([]);
  activeNote = signal<Note | null>(null);

  constructor(private http: HttpClient, private collabService: CollaborationService) {
    this.collabService.globalNotifications.subscribe((data) => {
      if (data && data.type === 'NOTE_SHARED') {
        this.getNotes().subscribe();
      }
    });
  }

  getNotes(): Observable<Note[]> {
    return this.http.get<{notes: Note[], total: number}>(this.API_URL).pipe(
      map(res => res.notes || []),
      tap(notes => this.notes.set(notes))
    );
  }

  getNoteById(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.API_URL}/${id}`).pipe(
      tap(note => this.activeNote.set(note))
    );
  }

  createNote(title: string, content: any = ''): Observable<Note> {
    return this.http.post<Note>(this.API_URL, { title, content }).pipe(
      tap(note => {
        this.notes.update(notes => [note, ...notes]);
        this.activeNote.set(note);
      })
    );
  }

  updateNote(id: string, data: Partial<Note>): Observable<Note> {
    return this.http.patch<Note>(`${this.API_URL}/${id}`, data).pipe(
      tap(updatedNote => {
        this.notes.update(notes => notes.map(n => n.id === id ? updatedNote : n));
        if (this.activeNote()?.id === id) {
          this.activeNote.set(updatedNote);
        }
      })
    );
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this.notes.update(notes => notes.filter(n => n.id !== id));
        if (this.activeNote()?.id === id) {
          this.activeNote.set(null);
        }
      })
    );
  }

  shareNote(id: string, sharedWithUserId: string, permission: 'VIEWER' | 'EDITOR'): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/share`, { sharedWithUserId, permission });
  }
}
