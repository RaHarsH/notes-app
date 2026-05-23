import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, MessageCircle, Share } from 'lucide-angular';
import { NotificationsService } from '../../../services/notifications';
import { Notification } from '../../../models';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './notifications.html'
})
export class NotificationsComponent implements OnInit {
  notificationsService = inject(NotificationsService);
  
  notifications = this.notificationsService.notifications;
  unreadCount = this.notificationsService.unreadCount;
  
  isOpen = signal(false);
  displayLimit = signal(5);

  // Icons
  BellIcon = Bell;
  MessageCircleIcon = MessageCircle;
  ShareIcon = Share;

  ngOnInit() {
    this.notificationsService.getNotifications().subscribe();
  }

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.displayLimit.set(5);
    }
  }

  loadMore() {
    this.displayLimit.update(v => v + 5);
  }

  displayNotifications() {
    return this.notifications().slice(0, this.displayLimit());
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe();
  }

  onNotificationClick(notif: Notification) {
    if (!notif.read) {
      this.notificationsService.markAsRead(notif.id).subscribe();
    }
    this.isOpen.set(false);
    // Ideally we would navigate to the note using a router if the notification has a noteId payload.
  }
}
