export interface PeopleRepository {
  ensureClinician(id: string): Promise<void>;
  ensurePatient(id: string): Promise<void>;
}

export const PEOPLE_REPOSITORY = 'PEOPLE_REPOSITORY';
