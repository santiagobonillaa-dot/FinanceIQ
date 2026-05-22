import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ConfirmationData {
  title: string;
  message: string;
  type: 'edit' | 'delete' | 'save' | 'close' | 'warning';
  details?: {
    label: string;
    value: string;
  }[];
  confirmText?: string;
  cancelText?: string;
  requireTextConfirmation?: boolean;
  textConfirmationValue?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  @Input() data: ConfirmationData | null = null;
  @Input() isVisible = false;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  textConfirmation = '';
  isConfirming = false;

  get modalIcon(): string {
    switch (this.data?.type) {
      case 'edit':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'save':
        return '💾';
      case 'close':
        return '❌';
      case 'warning':
      default:
        return '⚠️';
    }
  }

  get modalColor(): string {
    switch (this.data?.type) {
      case 'edit':
        return 'blue';
      case 'delete':
        return 'red';
      case 'save':
        return 'green';
      case 'close':
        return 'orange';
      case 'warning':
      default:
        return 'yellow';
    }
  }

  get confirmButtonText(): string {
    return this.data?.confirmText || 'Confirmar';
  }

  get cancelButtonText(): string {
    return this.data?.cancelText || 'Cancelar';
  }

  get canConfirm(): boolean {
    if (this.data?.requireTextConfirmation) {
      return this.textConfirmation === this.data?.textConfirmationValue;
    }
    return true;
  }

  onConfirm(): void {
    if (this.canConfirm) {
      this.isConfirming = true;
      this.confirm.emit(this.textConfirmation);
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.textConfirmation = '';
    this.isConfirming = false;
  }

  onClose(): void {
    this.cancel.emit();
    this.resetForm();
  }

  getModalColorClass(): string {
    return this.modalColor;
  }

  getConfirmButtonClass(): string {
    return `confirm-button-${this.modalColor}`;
  }

  getConfirmationPlaceholder(): string {
    return this.data?.textConfirmationValue 
      ? `Escribe '${this.data.textConfirmationValue}' para confirmar`
      : 'Escribe para confirmar';
  }
}
