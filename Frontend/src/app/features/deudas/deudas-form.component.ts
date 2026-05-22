import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DebtService } from '../../core/services/debt.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-deudas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deudas-form.component.html',
  styleUrls: ['./deudas-form.component.scss']
})
export class DeudasFormComponent implements OnInit {
  debtForm: FormGroup;
  isSubmitting = false;
  
  loanTypes = [
    { value: 'mortgage', label: 'Hipoteca' },
    { value: 'auto', label: 'Automóvil' },
    { value: 'personal', label: 'Personal' },
    { value: 'student', label: 'Estudiantil' },
    { value: 'business', label: 'Negocio' },
    { value: 'credit-card', label: 'Tarjeta de Crédito' },
    { value: 'other', label: 'Otro' }
  ];

  interestTypes = [
    { value: 'fixed', label: 'Fija' },
    { value: 'variable', label: 'Variable' },
    { value: 'hybrid', label: 'Híbrida' }
  ];

  compoundingFrequencies = [
    { value: 'daily', label: 'Diaria' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];

  paymentFrequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];

  amortizationTypes = [
    { value: 'french', label: 'Francesa (Cuotas iguales)' },
    { value: 'german', label: 'Alemana (Cuotas decrecientes)' },
    { value: 'straight-line', label: 'Línea recta (Amortización constante)' },
    { value: 'interest-only', label: 'Solo intereses' }
  ];

  priorities = [
    { value: 'critical', label: 'Crítico' },
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Medio' },
    { value: 'low', label: 'Bajo' }
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
    private debtService: DebtService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.debtForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      creditor: this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        type: ['bank', [Validators.required]],
        contact: this.fb.group({
          phone: ['', [Validators.maxLength(20)]],
          email: ['', [Validators.email, Validators.maxLength(100)]],
          website: ['', [Validators.maxLength(255)]],
          address: ['', [Validators.maxLength(255)]]
        })
      }),
      originalAmount: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
      currentBalance: [0, [Validators.required, Validators.min(0), Validators.max(999999999)]],
      currency: ['COP', Validators.required],
      interestRate: this.fb.group({
        annual: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
        type: ['fixed', [Validators.required]],
        compoundingFrequency: ['monthly', [Validators.required]]
      }),
      paymentSchedule: this.fb.group({
        frequency: ['monthly', [Validators.required]],
        dayOfMonth: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
        paymentAmount: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
        startDate: [new Date(), Validators.required],
        nextPaymentDate: [new Date(), Validators.required],
        endDate: [null]
      }),
      loanDetails: this.fb.group({
        type: ['personal', [Validators.required]],
        term: [12, [Validators.required, Validators.min(1), Validators.max(600)]],
        purpose: ['', [Validators.maxLength(255)]],
        collateral: ['', [Validators.maxLength(255)]],
        interestOnlyPeriod: [0],
        gracePeriod: [0]
      }),
      amortizationType: ['french', [Validators.required]],
      priority: ['medium', [Validators.required]],
      insurance: this.fb.group({
        hasInsurance: [false],
        monthlyPremium: [0],
        coverageAmount: [0]
      }),
      fees: this.fb.group({
        originationFee: [0],
        prepaymentPenalty: [0],
        latePaymentFee: [0],
        annualFee: [0]
      }),
      tags: [[]],
      isActive: [true]
    });
  }

  initializeForm(): void {
    const today = new Date();
    this.debtForm.patchValue({
      paymentSchedule: {
        startDate: today,
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth() + 1, 1)
      },
      isActive: true
    });
  }

  onSubmit(): void {
    if (this.debtForm.invalid) {
      this.markFormGroupTouched(this.debtForm);
      this.notificationService.showError('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    this.isSubmitting = true;
    const debtData = this.prepareDebtData();

    this.debtService.createDebt(debtData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Deuda creada exitosamente.');
        this.router.navigate(['/deudas']);
      },
      error: (error) => {
        console.error('Error creating debt:', error);
        this.notificationService.showError('Error al crear la deuda. Por favor, intente nuevamente.');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  prepareDebtData(): any {
    const formValue = this.debtForm.value;
    
    return {
      ...formValue,
      paymentSchedule: {
        ...formValue.paymentSchedule,
        startDate: new Date(formValue.paymentSchedule.startDate),
        nextPaymentDate: new Date(formValue.paymentSchedule.nextPaymentDate),
        endDate: formValue.paymentSchedule.endDate ? new Date(formValue.paymentSchedule.endDate) : null
      }
    };
  }

  onCancel(): void {
    this.router.navigate(['/deudas']);
  }

  onLoanTypeChange(): void {
    const loanType = this.debtForm.get('loanDetails.type')?.value;
    const termControl = this.debtForm.get('loanDetails.term');
    
    // Establecer valores por defecto según el tipo de préstamo
    switch (loanType) {
      case 'mortgage':
        termControl?.setValue(240); // 20 años
        break;
      case 'auto':
        termControl?.setValue(48); // 4 años
        break;
      case 'student':
        termControl?.setValue(120); // 10 años
        break;
      case 'personal':
        termControl?.setValue(36); // 3 años
        break;
      case 'credit-card':
        termControl?.setValue(12); // 1 año
        break;
      default:
        termControl?.setValue(12);
    }
  }

  onInterestTypeChange(): void {
    const interestType = this.debtForm.get('interestRate.type')?.value;
    
    if (interestType === 'variable') {
      this.notificationService.showWarning('Las tasas de interés variables pueden cambiar con el tiempo, afectando tus pagos mensuales.');
    }
  }

  calculateMonthlyPayment(): void {
    const principal = this.debtForm.get('originalAmount')?.value || 0;
    const annualRate = this.debtForm.get('interestRate.annual')?.value || 0;
    const term = this.debtForm.get('loanDetails.term')?.value || 0;
    const amortizationType = this.debtForm.get('amortizationType')?.value;

    if (principal > 0 && annualRate > 0 && term > 0) {
      const monthlyRate = annualRate / 100 / 12;
      const monthlyPayment = this.calculatePayment(principal, monthlyRate, term, amortizationType);
      
      this.debtForm.patchValue({
        'paymentSchedule.paymentAmount': monthlyPayment
      });
    }
  }

  private calculatePayment(principal: number, monthlyRate: number, term: number, type: string): number {
    switch (type) {
      case 'french':
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      case 'german':
        return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
      case 'interest-only':
        return principal * monthlyRate;
      default:
        return 0;
    }
  }

  addTag(event: any): void {
    const input = event.target;
    const value = input.value.trim();
    
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.debtForm.patchValue({ tags: this.tags });
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.debtForm.patchValue({ tags: this.tags });
    }
  }

  get tags(): string[] {
    return this.debtForm.get('tags')?.value || [];
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

  get name() { return this.debtForm.get('name'); }
  get originalAmount() { return this.debtForm.get('originalAmount'); }
  get currentBalance() { return this.debtForm.get('currentBalance'); }
  get currency() { return this.debtForm.get('currency'); }
  get creditorName() { return this.debtForm.get('creditor.name'); }
  get creditorType() { return this.debtForm.get('creditor.type'); }
  get interestRateAnnual() { return this.debtForm.get('interestRate.annual'); }
  get interestRateType() { return this.debtForm.get('interestRate.type'); }
  get paymentAmount() { return this.debtForm.get('paymentSchedule.paymentAmount'); }
  get loanType() { return this.debtForm.get('loanDetails.type'); }
  get loanTerm() { return this.debtForm.get('loanDetails.term'); }
  get amortizationType() { return this.debtForm.get('amortizationType'); }
  get priority() { return this.debtForm.get('priority'); }
}
