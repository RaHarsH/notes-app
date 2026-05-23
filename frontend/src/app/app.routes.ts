import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard';
import { LoginComponent } from './components/auth/login/login';
import { SignupComponent } from './components/auth/signup/signup';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { 
    path: '', 
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'note/:id', loadComponent: () => import('./components/editor/editor').then(m => m.EditorComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications-page').then(m => m.NotificationsPageComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
