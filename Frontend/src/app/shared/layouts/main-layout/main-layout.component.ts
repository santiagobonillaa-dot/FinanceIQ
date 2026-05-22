import { Component, Input, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RealTimeClockComponent } from '../../components/real-time-clock/real-time-clock.component';
import { UserProfileService } from '../../../core/services/user-profile.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RealTimeClockComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  @Input() pageTitle: string = 'Dashboard';
  
  // Propiedades dinámicas para el perfil
  userProfile: any = null;
  showUserMenu = false;
  
  constructor(private userProfileService: UserProfileService) {
    this.loadUserProfile();
  }

  ngOnInit(): void {
    // Cargar perfil almacenado al iniciar
    this.userProfileService.loadStoredProfile();
  }
  
  loadUserProfile(): void {
    // Suscribirse a cambios del perfil de usuario
    this.userProfileService.profile$.subscribe(profile => {
      this.userProfile = profile;
    });
  }

  get userInitials(): string {
    return this.userProfileService.getInitials();
  }
  
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }
  
  closeUserMenu(): void {
    this.showUserMenu = false;
  }
  
  logout(): void {
    // Cerrar sesión usando el servicio
    this.userProfileService.logout();
    console.log('Cerrando sesión...');
    // Redirigir al login
    window.location.href = '/login';
  }
  
  // Cerrar menú al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const userPanel = target.closest('.main-layout__user-panel');
    
    if (!userPanel && this.showUserMenu) {
      this.closeUserMenu();
    }
  }
}
