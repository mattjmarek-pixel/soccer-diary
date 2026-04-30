/**
 * In-memory storage stub — kept for backwards compatibility.
 * All real data access now goes through Drizzle ORM in server/db/index.ts.
 */
export interface IStorage {
  // Future: extend with CRUD methods as needed
}

export class MemStorage implements IStorage {}

export const storage = new MemStorage();
