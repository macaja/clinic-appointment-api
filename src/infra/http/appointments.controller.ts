import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { CreateAppointmentUseCase } from '../../application/use-cases/create-appointment.use-case';
import { ListAllAppointmentsUseCase } from '../../application/use-cases/list-all-appointments.use-case';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListQueryDto } from './dto/list-query.dto';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

export const CREATE_APPOINTMENT_USE_CASE = 'CREATE_APPOINTMENT_USE_CASE';
export const LIST_ALL_APPOINTMENTS_USE_CASE = 'LIST_ALL_APPOINTMENTS_USE_CASE';

@ApiTags('appointments')
@ApiHeader({
  name: 'X-Role',
  description: 'Caller role: patient | clinician | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject(CREATE_APPOINTMENT_USE_CASE)
    private readonly createAppointment: CreateAppointmentUseCase,
    @Inject(LIST_ALL_APPOINTMENTS_USE_CASE)
    private readonly listAllAppointments: ListAllAppointmentsUseCase,
  ) {}

  @Post()
  @Roles('patient', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 409, description: 'Overlap with existing appointment' })
  @ApiResponse({ status: 400, description: 'Invalid input or past appointment' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateAppointmentDto) {
    const appt = await this.createAppointment.execute(dto);
    return appt.toPrimitives();
  }

  @Get()
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'List of all upcoming appointments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAll(@Query() query: ListQueryDto) {
    const appts = await this.listAllAppointments.execute({
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
    return appts.map((a) => a.toPrimitives());
  }
}
