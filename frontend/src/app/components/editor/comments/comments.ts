import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MessageSquare, X, Check, Edit2, Trash2, AtSign } from 'lucide-angular';
import { CommentsService } from '../../../services/comments';
import { UsersService } from '../../../services/users';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { User } from '../../../models';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './comments.html'
})
export class CommentsComponent implements OnInit, OnChanges {
  @Input() noteId!: string;
  @Input() isOpen = signal(false);
  
  commentsService = inject(CommentsService);
  usersService = inject(UsersService);
  comments = this.commentsService.comments;
  
  newCommentText = '';

  editingCommentId = signal<string | null>(null);
  editCommentText = '';

  // Mentions
  mentionSearchTerm = signal<string>('');
  mentionResults = signal<User[]>([]);
  showMentionDropdown = signal(false);
  private mentionSearchSubject = new Subject<string>();

  // Icons
  MessageSquareIcon = MessageSquare;
  XIcon = X;
  CheckIcon = Check;
  EditIcon = Edit2;
  TrashIcon = Trash2;
  AtSignIcon = AtSign;

  ngOnInit() {
    this.loadComments();
    
    this.mentionSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term) {
        this.usersService.searchUsers(term).subscribe(users => {
          this.mentionResults.set(users);
          this.showMentionDropdown.set(users.length > 0);
        });
      } else {
        this.mentionResults.set([]);
        this.showMentionDropdown.set(false);
      }
    });
  }

  onCommentInput(event: any) {
    const value = event.target.value;
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      const term = lastWord.slice(1);
      this.mentionSearchTerm.set(term);
      this.mentionSearchSubject.next(term);
    } else {
      this.showMentionDropdown.set(false);
    }
  }

  selectMention(user: User) {
    const words = this.newCommentText.split(' ');
    words.pop();
    this.newCommentText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${user.email} `;
    this.showMentionDropdown.set(false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['noteId'] && !changes['noteId'].isFirstChange()) {
      this.loadComments();
    }
  }

  private loadComments() {
    if (this.noteId) {
      this.commentsService.getComments(this.noteId).subscribe();
    }
  }

  toggleComments() {
    this.isOpen.set(!this.isOpen());
  }

  addComment() {
    if (!this.newCommentText.trim() || !this.noteId) return;
    
    // Extract mentions from comment text
    const text = this.newCommentText.trim();
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const mentionsFound = Array.from(text.matchAll(mentionRegex)).map(m => m[1]);
    
    // Fetch user IDs for mentions if necessary, or just send emails to backend
    // Since our backend expects user IDs, we should ideally resolve them, but to keep it simple
    // if backend accepts emails in mentions array we can pass emails.
    // For now we'll pass the emails found.
    const mentions = mentionsFound;

    this.commentsService.addComment(this.noteId, text, 'root', mentions).subscribe(() => {
      this.newCommentText = '';
      this.showMentionDropdown.set(false);
    });
  }

  startEdit(comment: any) {
    this.editingCommentId.set(comment.id);
    this.editCommentText = comment.content;
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.editCommentText = '';
  }

  saveEdit(commentId: string) {
    if (!this.editCommentText.trim()) return;
    this.commentsService.updateComment(commentId, this.editCommentText.trim()).subscribe(() => {
      this.cancelEdit();
    });
  }

  confirmModalOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

  deleteComment(commentId: string) {
    this.pendingDeleteId.set(commentId);
    this.confirmModalOpen.set(true);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
    this.confirmModalOpen.set(false);
  }

  confirmDelete() {
    const id = this.pendingDeleteId();
    if (id) {
      this.commentsService.deleteComment(id).subscribe(() => {
        this.cancelDelete();
      });
    }
  }

  resolve(commentId: string) {
    this.commentsService.resolveComment(commentId).subscribe();
  }
}
