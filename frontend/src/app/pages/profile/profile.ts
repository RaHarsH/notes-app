import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { UsersService } from '../../services/users';
import { LucideAngularModule, User, Mail, Shield, Key } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  usersService = inject(UsersService);
  
  currentUser = signal<any>(null);

  UserIcon = User;
  MailIcon = Mail;
  ShieldIcon = Shield;
  KeyIcon = Key;

  ngOnInit() {
    this.authService.fetchMe().subscribe(user => {
      if (user?.id) {
        this.usersService.getUserById(user.id).subscribe(fullUser => {
          this.currentUser.set(fullUser || user);
        });
      }
    });
  }
}
