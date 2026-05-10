import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MessageSquare, X, Check } from 'lucide-angular';
import { CommentsService } from '../../../services/comments';

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
  comments = this.commentsService.comments;
  
  newCommentText = '';

  // Icons
  MessageSquareIcon = MessageSquare;
  XIcon = X;
  CheckIcon = Check;

  ngOnInit() {
    this.loadComments();
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
    
    this.commentsService.addComment(this.noteId, this.newCommentText.trim()).subscribe(() => {
      this.newCommentText = '';
    });
  }

  resolve(commentId: string) {
    this.commentsService.resolveComment(commentId).subscribe();
  }
}
