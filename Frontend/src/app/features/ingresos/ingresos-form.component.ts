import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncomeService } from '../../core/services/income.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-ingresos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingresos-form.component.html',
  styleUrls: ['./ingresos-form.component.scss']
})
export class IngresosFormComponent implements OnInit {
  incomeForm: FormGroup;
  isSubmitting = false;
  categories = [
    { value: 'salary', label: 'Salario' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'business', label: 'Negocio' },
    { value: 'investment', label: 'Inversiones' },
    { value: 'rental', label: 'Alquiler' },
    { value: 'dividend', label: 'Dividendos' },
    { value: 'other', label: 'Otros' }
  ];

  types = [
    { value: 'fixed', label: 'Fijo' },
    { value: 'variable', label: 'Variable' },
    { value: 'bonus', label: 'Bonificación' },
    { value: 'commission', label: 'Comisión' },
    { value: 'one-time', label: 'Único' }
  ];

  frequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' },
    { value: 'one-time', label: 'Único' }
  ];

  priorities = [
    { value: 'critical', label: 'Crítico' },
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Medio' },
    { value: 'low', label: 'Bajo' }
  ];

  paymentMethods = [
    { value: 'bank-transfer', label: 'Transferencia Bancaria' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'check', label: 'Cheque' },
    { value: 'digital-wallet', label: 'Billetera Digital' },
    { value: 'other', label: 'Otro' }
  ];

  currencies = [
    { value: 'COP', label: 'Peso Colombiano' },
    { value: 'USD', label: 'Dólar Estadounidense' },
    { value: 'EUR', label: 'Euro' },
    { value: 'GBP', label: 'Libra Esterlina' },
    { value: 'JPY', label: 'Yen Japonés' }
  ];

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.incomeForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
      currency: ['COP', Validators.required],
      type: ['fixed', Validators.required],
      category: ['other', Validators.required],
      frequency: ['monthly', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      description: ['', [Validators.maxLength(500)]],
      priority: ['medium', Validators.required],
      isTaxable: [true],
      paymentMethod: ['bank-transfer', Validators.required],
      tags: [[]],
      isActive: [true],
      recurringSettings: this.fb.group({
        autoDeposit: [false],
        reminderDays: [3, [Validators.min(0), Validators.max(30)]],
        maxOccurrences: [null],
        occurrenceCount: [0]
      })
    });
  }

  initializeForm(): void {
    this.incomeForm.patchValue({
      startDate: new Date(),
      isActive: true,
      isTaxable: true
    });
  }

  onSubmit(): void {
    if (this.incomeForm.invalid) {
      this.markFormGroupTouched(this.incomeForm);
      this.notificationService.showError('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    this.isSubmitting = true;
    const incomeData = this.prepareIncomeData();

    this.incomeService.createIncome(incomeData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Ingreso creado exitosamente.');
        this.router.navigate(['/ingresos']);
      },
      error: (error) => {
        console.error('Error creating income:', error);
        this.notificationService.showError('Error al crear el ingreso. Por favor, intente nuevamente.');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  prepareIncomeData(): any {
    const formValue = this.incomeForm.value;
    
    return {
      ...formValue,
      startDate: new Date(formValue.startDate),
      endDate: formValue.endDate ? new Date(formValue.endDate) : null
    };
  }

  onCancel(): void {
    this.router.navigate(['/ingresos']);
  }

  onFrequencyChange(): void {
    const frequency = this.incomeForm.get('frequency')?.value;
    const endDateControl = this.incomeForm.get('endDate');
    
    if (frequency === 'one-time') {
      endDateControl?.removeValidators(Validators.required);
    } else {
      endDateControl?.clearValidators();
    }
    
    endDateControl?.updateValueAndValidity();
  }

  addTag(event: any): void {
    const input = event.target;
    const value = input.value.trim();
    
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.incomeForm.patchValue({ tags: this.tags });
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.incomeForm.patchValue({ tags: this.tags });
    }
  }

  get tags(): string[] {
    return this.incomeForm.get('tags')?.value || [];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get name() { return this.incomeForm.get('name'); }
  get amount() { return this.incomeForm.get('amount'); }
  get currency() { return this.incomeForm.get('currency'); }
  get type() { return this.incomeForm.get('type'); }
  get category() { return this.incomeForm.get('category'); }
  get frequency() { return this.incomeForm.get('frequency'); }
  get startDate() { return this.incomeForm.get('startDate'); }
  get endDate() { return this.incomeForm.get('endDate'); }
  get description() { return this.incomeForm.get('description'); }
  get priority() { return this.incomeForm.get('priority'); }
  get paymentMethod() { return this.incomeForm.get('paymentMethod'); }

  getCurrencySymbol(): string {
    const currency = this.incomeForm.get('currency')?.value || 'COP';
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'COP': return '$';
      default: return '$';
    }
  }
}
