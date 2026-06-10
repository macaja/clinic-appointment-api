import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HealthController } from './infra/http/health.controller';
import {
  AppointmentsController,
  CREATE_APPOINTMENT_USE_CASE,
  LIST_ALL_APPOINTMENTS_USE_CASE,
} from './infra/http/appointments.controller';
import {
  CliniciansController,
  LIST_CLINICIAN_APPOINTMENTS_USE_CASE,
} from './infra/http/clinicians.controller';
import { createDb, SQLITE_DB } from './infra/persistence/sqlite/db';
import { SqliteAppointmentRepository } from './infra/persistence/sqlite/sqlite-appointment.repository';
import { SqlitePeopleRepository } from './infra/persistence/sqlite/sqlite-people.repository';
import { APPOINTMENT_REPOSITORY } from './application/ports/appointment-repository.port';
import { PEOPLE_REPOSITORY } from './application/ports/people-repository.port';
import { CLOCK, SystemClock } from './application/ports/clock.port';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment.use-case';
import { ListClinicianAppointmentsUseCase } from './application/use-cases/list-clinician-appointments.use-case';
import { ListAllAppointmentsUseCase } from './application/use-cases/list-all-appointments.use-case';
import { RolesGuard } from './infra/http/auth/roles.guard';
import Database from 'better-sqlite3';
import { AppointmentRepository } from './application/ports/appointment-repository.port';
import { PeopleRepository } from './application/ports/people-repository.port';
import { Clock } from './application/ports/clock.port';

@Module({
  controllers: [HealthController, AppointmentsController, CliniciansController],
  providers: [
    Reflector,
    {
      provide: SQLITE_DB,
      useFactory: () => createDb(),
    },
    {
      provide: APPOINTMENT_REPOSITORY,
      useFactory: (db: Database.Database) => new SqliteAppointmentRepository(db),
      inject: [SQLITE_DB],
    },
    {
      provide: PEOPLE_REPOSITORY,
      useFactory: (db: Database.Database) => new SqlitePeopleRepository(db),
      inject: [SQLITE_DB],
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: CREATE_APPOINTMENT_USE_CASE,
      useFactory: (ar: AppointmentRepository, pr: PeopleRepository, cl: Clock) =>
        new CreateAppointmentUseCase(ar, pr, cl),
      inject: [APPOINTMENT_REPOSITORY, PEOPLE_REPOSITORY, CLOCK],
    },
    {
      provide: LIST_CLINICIAN_APPOINTMENTS_USE_CASE,
      useFactory: (ar: AppointmentRepository, cl: Clock) =>
        new ListClinicianAppointmentsUseCase(ar, cl),
      inject: [APPOINTMENT_REPOSITORY, CLOCK],
    },
    {
      provide: LIST_ALL_APPOINTMENTS_USE_CASE,
      useFactory: (ar: AppointmentRepository, cl: Clock) => new ListAllAppointmentsUseCase(ar, cl),
      inject: [APPOINTMENT_REPOSITORY, CLOCK],
    },
    RolesGuard,
  ],
})
export class AppModule {}
