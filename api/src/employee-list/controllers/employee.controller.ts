import { Body, Controller, Get, Param, Post , Delete, Put, NotFoundException, BadRequestException, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.interface';
import { Observable, catchError, map, mergeMap, of } from 'rxjs';
import {FileInterceptor} from '@nestjs/platform-express'
import { diskStorage } from 'multer';
import {v4 as uuid4} from 'uuid';
import * as path from 'path';
import { join } from 'path';

export const storage = {
  storage: diskStorage({
    destination: './uploads/profileimages',
    filename: (req,file, cb) => {
      const filename: string = path.parse(file.originalname).name.replace(/\s/g,'') + uuid4();
      const extension: string = path.parse(file.originalname).ext;

      cb(null, `${filename}${extension}`)
    }
  })
}

@Controller('employee')
export class EmployeeController {
    constructor(private userService: EmployeeService) {}

    // @Post()
    // create(@Body() employee: Employee): Observable<Employee | Object> {
    //     return this.userService.create(employee);
    // }
    @Post()
    @UseInterceptors(FileInterceptor('file', storage))
    create(@Body() payload: {employee: Employee}, @UploadedFile() file): Observable<Employee | Object> {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      const updatedEmployeeData = JSON.parse(JSON.parse(JSON.stringify(payload.employee)))

      console.log('typeof ', updatedEmployeeData)

  
      // Assign the file path to the employee object
      // employee.profileImage = file.path;
  
      // Call the service method to create the employee
  return this.userService.create({...updatedEmployeeData, profileImage: file.filename});
}


    @Get(':id') // Route for findOne
    findOne(@Param() params): Observable<Employee> {
      return this.userService.findOne(params.id);
    }

    @Get() // Custom route name for findAll
    findAll(): Observable<Employee[]> {
      return this.userService.findAll();
    }

    @Delete(':id') //this code will delete the user and its logs
    deleteOne(@Param('id') id: string): Observable<any> {
        return this.userService.deleteEmployeeWithAccessLogs(Number(id)).pipe(
            catchError(error => {
                throw new NotFoundException('User not found');
            }),
            map(() => ({ message: 'User and associated access logs deleted successfully' }))
        );
    }
    @Put(':id')
    @UseInterceptors(FileInterceptor('file', storage))
    updateOne(@Param('id') id: string, @Body() payload: { employee: Employee }, @UploadedFile() file): Observable<any> {
      return this.userService.findOne(Number(id)).pipe(
        catchError(() => {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }),
        mergeMap(existingEmployee => {
          // If a file is provided, use the uploaded file's filename as the profile image
          // If no file is provided, retain the existing image filename from the database
          const profileImage = file ? file.filename : existingEmployee.profileImage;
    
          // Update the employee data
          const updatedEmployeeData = JSON.parse(JSON.parse(JSON.stringify(payload.employee)));
    
          const updatedEmployee: Employee = {
            ...updatedEmployeeData,
            profileImage: profileImage // Assign the file name as the profile image
          };
    
          // Update the employee using the service method
          return this.userService.updateOne(Number(id), updatedEmployee);
        })
      );
    }
    
    

    @Post('log-access')
    logEmployeeAccess(@Body() accessData: { employeeId: number, accessType: string, roleAtAccess: string }): Promise<void> {
      const { employeeId, accessType, roleAtAccess } = accessData;
    
      if (!employeeId || !accessType || !roleAtAccess) {
        throw new BadRequestException('Invalid access data');
      }
    
      return this.userService.logEmployeeAccess(employeeId, accessType, roleAtAccess).toPromise();
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file',storage))
    uploadFile(@UploadedFile()file): Observable<Object> {
      console.log(file);
      return of({imagePath: file.filename});

    }
    
    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename')imagename, @Res() res):Observable<Object> {
      return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/'+ imagename)))
    }

    @Get('count')
    countEmployees(): Observable<number> {
      return this.userService.countEmployees();
    }
    

}
