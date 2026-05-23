import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../services/notifications';
import { LucideAngularModule, Bell, MessageCircle, Share, CheckCircle } from 'lucide-angular';
import { Notification } from '../../models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notifications-page.html'
})
export class NotificationsPageComponent implements OnInit {
  notificationsService = inject(NotificationsService);
  
  notifications = this.notificationsService.notifications;
  displayLimit = signal(20);
  
  displayNotifications = computed(() => {
    return this.notifications().slice(0, this.displayLimit());
  });

  // Icons
  BellIcon = Bell;
  MessageCircleIcon = MessageCircle;
  ShareIcon = Share;
  CheckCircleIcon = CheckCircle;

  ngOnInit() {
    this.notificationsService.getNotifications().subscribe();
  }

  loadMore() {
    this.displayLimit.update(v => v + 20);
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe();
  }

  markAsRead(id: string) {
    this.notificationsService.markAsRead(id).subscribe();
  }
}
