import { Component, ViewChild, ElementRef } from '@angular/core';
import { EmployeeService } from 'src/app/services/employee.service';
import { DialogService } from 'src/app/services/dialog.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-user-form',
  templateUrl: './add-user-form.component.html',
  styleUrls: ['./add-user-form.component.css']
})
export class AddUserFormComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('rfidInput') rfidInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fingerprintInput') fingerprintInput!: ElementRef<HTMLInputElement>;
  @ViewChild('employeeRole', {static: false}) employeeRole?: ElementRef;

  addUserForm: boolean = false;
  selectedImage!: File;
  photoSrc: string | ArrayBuffer | null = null;
  editMode: boolean = true; // Assuming edit mode is true to enable the "Begin scan" functionality
  baseUrl = this.employeeService.apiUrl;
  userForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private employeeService: EmployeeService, private dialogService: DialogService) { 
    this.userForm = this.formBuilder.group({
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      profileImage: [''],
      phone: ['', Validators.required],
      rfidtag: [''],
      fingerprint: ['']
    });
  }

  newEmployee = {
    id: 0,
    fullname: '',
    email: '',
    phone: '',
    role: '',
    rfidtag: '',
    profileImage: '' // Change the type to match the backend
  };

  showAddUserForm() {
    this.addUserForm = true;
  }

  hideAddUserForm() {
    this.addUserForm = false;
    this.resetForm();
  }

  resetForm() {
    this.userForm.reset();
    this.newEmployee = {
      id: 0,
      fullname: '',
      email: '',
      phone: '',
      role: '',
      rfidtag: '',
      profileImage: '' // Reset to match the backend
    };
    this.photoSrc = null;
    this.selectedImage = null!;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        this.selectedImage = file;

        // Update the image source for preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          this.photoSrc = reader.result;
        };
      } else {
        alert('Please select a valid image format (jpg, png).');
      }
    }
  }

  submitUser(): void {
    // Mark all fields as touched to trigger validation messages
    this.userForm.markAllAsTouched();
  
    if (this.userForm.valid) {
      const newEmployee = this.userForm.value;
  
      if (!this.selectedImage) {
        this.employeeService.addEmployeeWithoutImage(newEmployee)
          .subscribe(
            response => {
              this.dialogService.openSuccessDialog('Employee Created Successfully').subscribe(confirmed => {
                if (confirmed) {
                  this.employeeService.reloadPage();
                  this.hideAddUserForm();
                }
              });
            },
            error => {
              this.handleError(error);
            }
          );
      } else {
        this.employeeService.addEmployee(newEmployee, this.selectedImage)
          .subscribe(
            response => {
              this.dialogService.openSuccessDialog('Employee Created Successfully').subscribe(confirmed => {
                if (confirmed) {
                  this.employeeService.reloadPage();
                  this.hideAddUserForm();
                }
              });
            },
            error => {
              this.handleError(error);
            }
          );
      }
    } else {
      // Check specifically for email validation error
      if (this.userForm.get('email')?.errors?.['email']) {
        this.dialogService.openAlertDialog('Please enter a valid email address.');
      } else {
        this.dialogService.openAlertDialog('Please fill in all required fields correctly.');
      }
    }
  }

  handleError(error: any) {
    throw new Error('Method not implemented.');
  }

  enableEdit(): void {
    this.editMode = true;
  }

  startRFIDScan(): void {
    if (this.editMode) {
      this.rfidInput.nativeElement.removeAttribute('disabled');
      this.rfidInput.nativeElement.focus();
    }
  }

  startFingerprintScan(): void {
    if (this.editMode) {
      this.fingerprintInput.nativeElement.removeAttribute('disabled');
      this.fingerprintInput.nativeElement.focus();
    }
  }
}
