import { PeopleRepository } from '../../src/application/ports/people-repository.port';

export class InMemoryPeopleRepository implements PeopleRepository {
  readonly clinicianIds = new Set<string>();
  readonly patientIds = new Set<string>();

  async ensureClinician(id: string): Promise<void> {
    this.clinicianIds.add(id);
  }

  async ensurePatient(id: string): Promise<void> {
    this.patientIds.add(id);
  }
}
