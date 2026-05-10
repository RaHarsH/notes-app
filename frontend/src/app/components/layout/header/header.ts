import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Menu, Sun, Moon, Share2, X } from 'lucide-angular';
import { AuthService } from '../../../services/auth';
import { NotesService } from '../../../services/notes';
import { CollaborationService } from '../../../services/collaboration';
import { NotificationsComponent } from '../notifications/notifications';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NotificationsComponent, FormsModule],
  templateUrl: './header.html'
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  notesService = inject(NotesService);
  collabService = inject(CollaborationService);

  user = this.authService.user;
  activeNote = this.notesService.activeNote;
  activeUsers = this.collabService.activeUsers;
  
  isDarkMode = signal(true);

  // Icons
  MenuIcon = Menu;
  SunIcon = Sun;
  MoonIcon = Moon;
  Share2Icon = Share2;
  XIcon = X;

  isShareModalOpen = signal(false);
  shareUserId = '';
  sharePermission: 'VIEWER' | 'EDITOR' = 'VIEWER';

  ngOnInit() {
    this.isDarkMode.set(document.documentElement.classList.contains('dark'));
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  openShareModal() {
    if (!this.activeNote()) return;
    this.isShareModalOpen.set(true);
  }

  closeShareModal() {
    this.isShareModalOpen.set(false);
    this.shareUserId = '';
    this.sharePermission = 'VIEWER';
  }

  shareNote() {
    const note = this.activeNote();
    if (!note || !this.shareUserId.trim()) return;

    this.notesService.shareNote(note.id, this.shareUserId.trim(), this.sharePermission).subscribe({
      next: () => {
        this.closeShareModal();
        alert('Note shared successfully!');
      },
      error: (err) => {
        alert('Failed to share note. User might not exist.');
        console.error(err);
      }
    });
  }
}
