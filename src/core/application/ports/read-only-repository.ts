export interface ReadOnlyRepository<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
}
