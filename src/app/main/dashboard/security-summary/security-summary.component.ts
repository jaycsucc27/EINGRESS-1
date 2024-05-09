import { Component, NgModule, HostListener } from '@angular/core';
import { multi } from './data';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { AccessLogService } from 'src/app/services/access-log.service';
import { EmployeeService } from 'src/app/services/employee.service'; // Import the EmployeeService
import { combineLatest, interval, switchMap } from 'rxjs';
import { LoginTotalService } from 'src/app/services/login-total.service';

@Component({
  selector: 'app-security-summary',
  templateUrl: './security-summary.component.html',
  styleUrls: ['./security-summary.component.css'],
})
export class SecuritySummaryComponent {
  below: any;
  multi: any[] = [];
  currentDate: string = new Date().toLocaleDateString();
  // currentDate: string = '5/3/2024';
  LoginsToday: number = 0; 
  total: number = 0; 
  NotOnSite: number = 0;

  showDataLabel: boolean = false;
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  yScaleMax: number = 0;
  gradient: boolean = true;
  barPadding: number = 2;
  groupPadding: number = 4;
  wrapTicks: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string;
  showYAxisLabel: boolean = true;
  legendTitle: string = 'Legend';
  counter = 1;

  chartWidth: number =  10;
  chartHeight: number = 10;

  colorScheme: Color = {
    name: 'customScheme', 
    selectable: true, 
    group: ScaleType.Ordinal, 
    domain: ['#008B38', '#2291F2'], 
  };

  constructor(private accessLogService: AccessLogService, private employeeService: EmployeeService, private logintotalService: LoginTotalService) {
    Object.assign(this, { multi });

    // Set the xAxisLabel dynamically to the current month
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.xAxisLabel = monthNames[currentDate.getMonth()]; // Set the xAxisLabel to the current month

    this.calculateChartDimensions();
    this.onResize(null); // Initialize chart dimensions
    this.fetchLoginsToday(); // Fetch LoginsToday data
    this.loadEmployeeInfo(); // Fetch total employees data
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculateChartDimensions();
  }

  calculateChartDimensions() {
    this.chartWidth = window.innerWidth * 0.63; 
    this.chartHeight = window.innerHeight * 0.45;
  }

 
  fetchLoginsToday() {
    // Fetch employees and access logs in parallel
    combineLatest([
      this.employeeService.getEmployee(),
      this.accessLogService.getAccessLogs()
    ]).subscribe(
      ([employees, accessLogs]) => {
        // Calculate total employees
        this.total = employees.length;

        // Set yScaleMax based on total
        this.yScaleMax = this.total * 1.2; // You can adjust the multiplier as needed

        // Filter employees whose last login date matches the current date
        const loggedTodayEmployees = employees.filter(employee => {
          // Check if the employee has a last login date and it matches the current date
          return employee.lastlogdate && new Date(employee.lastlogdate).toLocaleDateString() === this.currentDate;
        });
  
        // Count the number of employees who logged in today
        this.LoginsToday = loggedTodayEmployees.length;
        
        // Calculate NotOnSite
        this.NotOnSite = this.total - this.LoginsToday;

  // Check if today's login statistics exist in the database
  this.logintotalService.getTodayLoginStatistics().subscribe(
    (todayLoginStats) => {
      if (!todayLoginStats) {
        // Today's login statistics don't exist, so create a default entry
        this.logintotalService.createDefaultEntry(this.LoginsToday.toString(), this.NotOnSite.toString()).subscribe(
          () => {
            console.log('Default entry created successfully.');
            // After creating the default entry, update the login statistics in the backend
            this.updateLoginStatisticsInBackend();
          },
          error => {
            console.error('Error creating default entry:', error);
          }
        );
      } else {
        // Today's login statistics already exist, update them in the backend
        this.updateLoginStatisticsInBackend();
      }
    },
    error => {
      console.error('Error fetching today\'s login statistics:', error);
    }
  );
},
error => {
  console.error('Error fetching employees:', error);
}
);
}

updateLoginStatisticsInBackend() {
// Update the login statistics in the backend
this.logintotalService.updateTodayLoginStatistics(this.LoginsToday.toString(), this.NotOnSite.toString()).subscribe(
() => {
  console.log('Login statistics updated successfully.');
},
error => {
  console.error('Error updating login statistics:', error);
}
);
}

  // updateLoginStatisticsInBackend() {
  //   // Calculate LoginsToday and NotOnSite
  //   const totalEmployees$ = this.employeeService.getEmployee();
    
  //   const today = new Date().toLocaleDateString();
  
  //   totalEmployees$.subscribe(
  //     employees => {
  //       const totalEmployees = employees.length;
  //       const loggedTodayEmployees = employees.filter(employee => {
  //         return employee.lastlogdate && new Date(employee.lastlogdate).toLocaleDateString() === today;
  //       });
        
  //       const LoginsToday = loggedTodayEmployees.length;
  //       const NotOnSite = totalEmployees - LoginsToday;
  
  //       // Update the login statistics in the backend
  //       this.logintotalService.updateTodayLoginStatistics(LoginsToday.toString(), NotOnSite.toString()).subscribe(
  //         () => {
  //           console.log('Login statistics updated successfully.');
  //         },
  //         error => {
  //           console.error('Error updating login statistics:', error);
  //         }
  //       );
  //     },
  //     error => {
  //       console.error('Error fetching employees:', error);
  //     }
  //   );
  // }
  

  loadEmployeeInfo() {
    this.employeeService.getEmployee().subscribe(
      employees => {
        this.total = employees.length; // Calculate total employees
        // Set yScaleMax based on total
        this.yScaleMax = this.total * 1.2; // You can adjust the multiplier as needed
      },
      error => {
        console.error('Error fetching employees:', error);
      }
    );
  }


  

  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
  xAxisTickFormatting(value: any): string {
    return value;
    const date = new Date(value);
    const dayOfMonth = date.getDate();
    return dayOfMonth.toString();
  }

  yAxisTickFormatting(value: number): string {
    return (Math.round(value / 1) * 1).toString();
  }

  customLegend = {

  };

  
}
