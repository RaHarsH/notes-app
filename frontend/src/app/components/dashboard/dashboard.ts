import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { HeaderComponent } from '../layout/header/header';
import { LayoutService } from '../../services/layout';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  layoutService = inject(LayoutService);
}
