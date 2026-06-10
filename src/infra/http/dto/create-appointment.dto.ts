import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'c1', description: 'Clinician ID' })
  @IsString()
  @IsNotEmpty()
  clinicianId!: string;

  @ApiProperty({ example: 'p1', description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: '2999-01-01T10:00:00Z', description: 'Appointment start (ISO 8601)' })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  start!: string;

  @ApiProperty({ example: '2999-01-01T10:30:00Z', description: 'Appointment end (ISO 8601)' })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  end!: string;
}
