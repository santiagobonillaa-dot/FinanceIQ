import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLogin: Date;
  memberSince: Date;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuario',
  lastName: 'Demo',
  email: 'usuario.demo@financeiq.com',
  phone: '+57 300 123 4567',
  role: 'Analista Financiero',
    isActive: true,
  lastLogin: new Date(),
  memberSince: new Date('2025-01-15')
};

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private profileSubject = new BehaviorSubject<UserProfile>(DEFAULT_PROFILE);
  profile$: Observable<UserProfile> = this.profileSubject.asObservable();

  getProfile(): UserProfile {
    return this.profileSubject.getValue();
  }

  setProfile(profile: UserProfile): void {
    this.profileSubject.next(profile);
    // Guardar en localStorage para persistencia
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  updateProfile(updates: Partial<UserProfile>): void {
    const currentProfile = this.getProfile();
    const updatedProfile = { ...currentProfile, ...updates };
    this.setProfile(updatedProfile);
  }

  getInitials(): string {
    const profile = this.getProfile();
    const nameInitial = profile.name.charAt(0).toUpperCase();
    const lastNameInitial = profile.lastName.charAt(0).toUpperCase();
    return `${nameInitial}${lastNameInitial}`;
  }

  getFullName(): string {
    const profile = this.getProfile();
    return `${profile.name} ${profile.lastName}`;
  }

  // Cargar perfil desde localStorage al iniciar
  loadStoredProfile(): void {
    try {
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        // Convertir fechas de string a Date
        profile.lastLogin = new Date(profile.lastLogin);
        profile.memberSince = new Date(profile.memberSince);
        this.setProfile(profile);
      }
    } catch (error) {
      console.warn('Error loading stored profile:', error);
      // Usar perfil por defecto
      this.setProfile(DEFAULT_PROFILE);
    }
  }

  // Método para simular login (reemplazar con auth real)
  login(userData: Partial<UserProfile>): void {
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      ...userData,
      lastLogin: new Date(),
      isActive: true
    };
    this.setProfile(profile);
  }

  // Método para logout
  logout(): void {
    // Limpiar perfil y localStorage
    this.setProfile(DEFAULT_PROFILE);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token'); // También limpiar token de auth
  }
}
