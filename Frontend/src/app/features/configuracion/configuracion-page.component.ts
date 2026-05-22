import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { UserProfileService } from '../../core/services/user-profile.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ReactiveFormsModule],
  templateUrl: './configuracion-page.component.html',
  styleUrl: './configuracion-page.component.scss'
})
export class ConfiguracionPageComponent implements OnInit {
  selectedOption: 'Perfil' | 'Monedas' | 'Datos' = 'Perfil';
  profileForm!: FormGroup;
  isEditing = false;

  constructor(
    private userProfileService: UserProfileService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.createProfileForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private createProfileForm(): FormGroup {
    return this.fb.group({
      name: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      role: ['']
    });
  }

  loadUserProfile(): void {
    this.userProfileService.profile$.subscribe(profile => {
      this.profileForm.patchValue({
        name: profile.name,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role
      });
    });
  }

  setSelectedOption(option: 'Perfil' | 'Monedas' | 'Datos'): void {
    this.selectedOption = option;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Si cancela edición, recargar datos originales
      this.loadUserProfile();
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const updatedProfile = {
        ...this.userProfileService.getProfile(),
        ...this.profileForm.value
      };
      this.userProfileService.updateProfile(updatedProfile);
      this.isEditing = false;
      console.log('Perfil actualizado:', updatedProfile);
    }
  }

  get userProfile() {
    return this.userProfileService.getProfile();
  }
}
