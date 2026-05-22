import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-gastos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gastos-form.component.html',
  styleUrls: ['./gastos-form.component.scss']
})
export class GastosFormComponent implements OnInit {
  expenseForm: FormGroup;
  isSubmitting = false;
  categories = [
    { value: 'housing', label: 'Vivienda' },
    { value: 'food', label: 'Alimentos' },
    { value: 'transportation', label: 'Transporte' },
    { value: 'utilities', label: 'Servicios' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'education', label: 'Educación' },
    { value: 'shopping', label: 'Compras' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'other', label: 'Otros' }
  ];

  types = [
    { value: 'fixed', label: 'Fijo' },
    { value: 'variable', label: 'Variable' },
    { value: 'discretionary', label: 'Discrecional' },
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
    { value: 'cash', label: 'Efectivo' },
    { value: 'debit-card', label: 'Tarjeta de Débito' },
    { value: 'credit-card', label: 'Tarjeta de Crédito' },
    { value: 'bank-transfer', label: 'Transferencia Bancaria' },
    { value: 'digital-wallet', label: 'Billetera Digital' },
    { value: 'other', label: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.expenseForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
      currency: ['COP', Validators.required],
      type: ['variable', Validators.required],
      category: ['other', Validators.required],
      frequency: ['monthly', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      description: ['', [Validators.maxLength(500)]],
      priority: ['medium', Validators.required],
      isTaxDeductible: [false],
      budgetLimit: [null, [Validators.min(0)]],
      actualSpending: [0],
      paymentMethod: ['cash', Validators.required],
      tags: [[]],
      isActive: [true],
      recurringSettings: this.fb.group({
        autoCharge: [false],
        reminderDays: [3, [Validators.min(0), Validators.max(30)]],
        maxOccurrences: [null],
        occurrenceCount: [0]
      })
    });
  }

  initializeForm(): void {
    // Establecer valores por defecto si es necesario
    this.expenseForm.patchValue({
      startDate: new Date(),
      isActive: true,
      actualSpending: 0
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched(this.expenseForm);
      this.notificationService.showError('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    this.isSubmitting = true;
    const expenseData = this.prepareExpenseData();

    this.expenseService.createExpense(expenseData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Egreso creado exitosamente.');
        this.router.navigate(['/gastos']);
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        this.notificationService.showError('Error al crear el egreso. Por favor, intente nuevamente.');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  prepareExpenseData(): any {
    const formValue = this.expenseForm.value;
    
    return {
      ...formValue,
      startDate: new Date(formValue.startDate),
      endDate: formValue.endDate ? new Date(formValue.endDate) : null
    };
  }

  onCancel(): void {
    this.router.navigate(['/gastos']);
  }

  onFrequencyChange(): void {
    const frequency = this.expenseForm.get('frequency')?.value;
    const endDateControl = this.expenseForm.get('endDate');
    
    if (frequency === 'one-time') {
      endDateControl?.removeValidators(Validators.required);
    } else {
      endDateControl?.clearValidators();
    }
    
    endDateControl?.updateValueAndValidity();
  }

  onTypeChange(): void {
    const type = this.expenseForm.get('type')?.value;
    const budgetLimitControl = this.expenseForm.get('budgetLimit');
    
    if (type === 'fixed' || type === 'variable') {
      budgetLimitControl?.addValidators([Validators.required, Validators.min(0)]);
    } else {
      budgetLimitControl?.clearValidators();
    }
    
    budgetLimitControl?.updateValueAndValidity();
  }

  addTag(event: any): void {
    const input = event.target;
    const value = input.value.trim();
    
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.expenseForm.patchValue({ tags: this.tags });
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.expenseForm.patchValue({ tags: this.tags });
    }
  }

  get tags(): string[] {
    return this.expenseForm.get('tags')?.value || [];
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

  get name() { return this.expenseForm.get('name'); }
  get amount() { return this.expenseForm.get('amount'); }
  get currency() { return this.expenseForm.get('currency'); }
  get type() { return this.expenseForm.get('type'); }
  get category() { return this.expenseForm.get('category'); }
  get frequency() { return this.expenseForm.get('frequency'); }
  get startDate() { return this.expenseForm.get('startDate'); }
  get endDate() { return this.expenseForm.get('endDate'); }
  get description() { return this.expenseForm.get('description'); }
  get priority() { return this.expenseForm.get('priority'); }
  get budgetLimit() { return this.expenseForm.get('budgetLimit'); }
  get paymentMethod() { return this.expenseForm.get('paymentMethod'); }
}
