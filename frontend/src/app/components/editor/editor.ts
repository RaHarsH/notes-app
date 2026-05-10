import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, MessageSquare } from 'lucide-angular';
import { NotesService } from '../../services/notes';
import { CollaborationService } from '../../services/collaboration';
import { CommentsComponent } from './comments/comments';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CommentsComponent],
  templateUrl: './editor.html'
})
export class EditorComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  notesService = inject(NotesService);
  collabService = inject(CollaborationService);

  note = this.notesService.activeNote;
  loading = signal(true);
  saving = signal(false);
  isCommentsOpen = signal(false);

  MessageSquareIcon = MessageSquare;

  private titleUpdate$ = new Subject<string>();
  private contentUpdate$ = new Subject<string>();
  noteId = '';

  constructor() {
    // Auto-save title
    this.titleUpdate$.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(title => {
      if (this.noteId) {
        this.saving.set(true);
        this.notesService.updateNote(this.noteId, { title }).subscribe({
          next: () => this.saving.set(false),
          error: () => this.saving.set(false)
        });
      }
    });

    // Auto-save content
    this.contentUpdate$.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(content => {
      if (this.noteId) {
        this.saving.set(true);
        this.notesService.updateNote(this.noteId, { content }).subscribe({
          next: () => {
            this.saving.set(false);
            // Also sync via websockets
            this.collabService.sendUpdate(this.noteId, content);
          },
          error: () => this.saving.set(false)
        });
      }
    });

    // Listen to real-time changes
    effect(() => {
      const changes = this.collabService.documentChanges();
      if (changes && changes !== this.note()?.content) {
        // Simple overwrite for now, real OT/CRDT comes later
        this.notesService.activeNote.update(n => n ? { ...n, content: changes } : null);
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadNote(id);
      }
    });
  }

  loadNote(id: string) {
    if (this.noteId) {
      this.collabService.disconnect();
    }
    this.noteId = id;
    this.loading.set(true);
    this.notesService.getNoteById(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.collabService.connect(id);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onTitleChange(title: string) {
    this.notesService.activeNote.update(n => n ? { ...n, title } : null);
    this.titleUpdate$.next(title);
  }

  onContentChange(content: string) {
    this.notesService.activeNote.update(n => n ? { ...n, content } : null);
    this.contentUpdate$.next(content);
  }

  toggleComments() {
    this.isCommentsOpen.set(!this.isCommentsOpen());
  }

  updateCursor(target: any) {
    if (this.noteId && target && typeof target.selectionStart === 'number') {
      const position = { line: 0, ch: target.selectionStart };
      this.collabService.sendCursor(this.noteId, position);
    }
  }

  ngOnDestroy() {
    this.collabService.disconnect();
  }
}
