import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Plus, FileText, ChevronRight, LogOut, Trash2 } from 'lucide-angular';
import { AuthService } from '../../../services/auth';
import { NotesService } from '../../../services/notes';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, RouterModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  notesService = inject(NotesService);
  router = inject(Router);

  user = this.authService.user;
  notes = this.notesService.notes;
  activeNote = this.notesService.activeNote;
  
  isOpen = signal(true); // Can be driven by a layout service later
  searchQuery = signal('');

  filteredNotes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allNotes = this.notes();
    if (!query) return allNotes;
    return allNotes.filter(n => 
      (n.title && n.title.toLowerCase().includes(query)) || 
      (n.content && typeof n.content === 'string' && n.content.toLowerCase().includes(query))
    );
  });

  // Icons
  SearchIcon = Search;
  PlusIcon = Plus;
  FileTextIcon = FileText;
  ChevronRightIcon = ChevronRight;
  LogOutIcon = LogOut;
  Trash2Icon = Trash2;

  ngOnInit() {
    this.notesService.getNotes().subscribe();
  }

  createNewNote() {
    this.notesService.createNote('Untitled').subscribe(note => {
      this.router.navigate(['/note', note.id]);
    });
  }

  openNote(id: string) {
    this.router.navigate(['/note', id]);
  }

  confirmModalOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

  deleteNote(id: string, event: Event) {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
    this.confirmModalOpen.set(true);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
    this.confirmModalOpen.set(false);
  }

  confirmDelete() {
    const id = this.pendingDeleteId();
    if (id) {
      this.notesService.deleteNote(id).subscribe(() => {
        if (this.activeNote()?.id === id) {
          this.router.navigate(['/dashboard']);
        }
        this.cancelDelete();
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
