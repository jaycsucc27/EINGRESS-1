import { Body, Controller, Get, Param, Post , Delete, Put} from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.interface';
import { Observable } from 'rxjs';

@Controller('employee')
export class EmployeeController {
    constructor(private userService: EmployeeService) {}

    @Post()
    create(@Body() employee: Employee): Observable<Employee | Object> {
      return this.userService.create(employee);
    }

    @Get(':id') // Route for findOne
    findOne(@Param() params): Observable<Employee> {
      return this.userService.findOne(params.id);
    }

    @Get() // Custom route name for findAll
    findAll(): Observable<Employee[]> {
      return this.userService.findAll();
    }

    @Delete(':id')
    deleteOne(@Param('id') id: string): Observable<any> {
      return this.userService.deleteOne(Number(id));
    }

    @Put(':id')
    updateOne(@Param('id') id: string, @Body() employee: Employee): Observable<any> {
      return this.userService.updateOne(Number(id), employee);
    }
}