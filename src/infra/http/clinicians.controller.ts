import { Controller, Get, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ListClinicianAppointmentsUseCase } from '../../application/use-cases/list-clinician-appointments.use-case';
import { ListQueryDto } from './dto/list-query.dto';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

export const LIST_CLINICIAN_APPOINTMENTS_USE_CASE = 'LIST_CLINICIAN_APPOINTMENTS_USE_CASE';

@ApiTags('clinicians')
@ApiHeader({
  name: 'X-Role',
  description: 'Caller role: patient | clinician | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('clinicians')
export class CliniciansController {
  constructor(
    @Inject(LIST_CLINICIAN_APPOINTMENTS_USE_CASE)
    private readonly listClinicianAppointments: ListClinicianAppointmentsUseCase,
  ) {}

  @Get(':id/appointments')
  @Roles('clinician', 'admin')
  @ApiResponse({ status: 200, description: 'Clinician upcoming appointments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listForClinician(@Param('id') id: string, @Query() query: ListQueryDto) {
    const appts = await this.listClinicianAppointments.execute({
      clinicianId: id,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return appts.map((a) => a.toPrimitives());
  }
}
