import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Menu, Sun, Moon, Share2, X } from 'lucide-angular';
import { AuthService } from '../../../services/auth';
import { NotesService } from '../../../services/notes';
import { CollaborationService } from '../../../services/collaboration';
import { NotificationsComponent } from '../notifications/notifications';
import { UsersService } from '../../../services/users';
import { LayoutService } from '../../../services/layout';

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
  layoutService = inject(LayoutService);
  
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
  shareType = signal<'email' | 'id'>('email');

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      this.isDarkMode.set(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      this.isDarkMode.set(false);
    } else {
      this.isDarkMode.set(document.documentElement.classList.contains('dark'));
    }
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  usersService = inject(UsersService);

  openShareModal() {
    if (!this.activeNote()) return;
    this.isShareModalOpen.set(true);
  }

  closeShareModal() {
    this.isShareModalOpen.set(false);
    this.shareUserId = '';
    this.sharePermission = 'VIEWER';
  }

  shareStatus = signal<{ type: 'success' | 'error', message: string } | null>(null);

  closeShareStatus() {
    this.shareStatus.set(null);
  }

  shareNote() {
    const note = this.activeNote();
    const query = this.shareUserId.trim();
    if (!note || !query) return;

    // Search user by email or ID
    this.usersService.searchUsers(query).subscribe({
      next: (users) => {
        let targetUser = users.find(u => u.email === query || u.id === query);
        
        if (!targetUser && users.length > 0) {
           targetUser = users[0];
        }

        if (targetUser) {
          this.notesService.shareNote(note.id, targetUser.id, this.sharePermission).subscribe({
            next: () => {
              this.closeShareModal();
              this.shareStatus.set({ type: 'success', message: `Note shared successfully with ${targetUser.email}!` });
            },
            error: (err) => {
              this.closeShareModal();
              this.shareStatus.set({ type: 'error', message: err.error?.message || 'Failed to share note. User might not exist.' });
              console.error(err);
            }
          });
        } else {
          this.closeShareModal();
          this.shareStatus.set({ type: 'error', message: 'User not found. Please enter a valid email or user ID.' });
        }
      },
      error: () => {
        this.closeShareModal();
        this.shareStatus.set({ type: 'error', message: 'Error searching for user.' });
      }
    });
  }
}
