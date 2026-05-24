export type CatalogService = {
  createDatasource?: { execute(input: unknown): Promise<unknown> };
  updateDatasource?: { execute(id: string, input: unknown): Promise<unknown> };
  deleteDatasource?: { execute(id: string): Promise<void> };
  getDatasource: { execute(id: string): Promise<unknown> };
  listDatasources: { execute(): Promise<unknown[]> };
  createQuestion?: { execute(input: unknown): Promise<unknown> };
  updateQuestion?: { execute(id: string, input: unknown): Promise<unknown> };
  deleteQuestion?: { execute(id: string): Promise<void> };
  getQuestion: { execute(id: string): Promise<unknown> };
  listQuestions: { execute(): Promise<unknown[]> };
  createDashboard?: { execute(input: unknown): Promise<unknown> };
  updateDashboard?: { execute(id: string, input: unknown): Promise<unknown> };
  deleteDashboard?: { execute(id: string): Promise<void> };
  getDashboard: { execute(id: string): Promise<unknown> };
  listDashboards: { execute(): Promise<unknown[]> };
};

let _service: CatalogService | null = null;

export function setCatalogService(service: CatalogService): void {
  _service = service;
}

export function getCatalogService(): CatalogService {
  if (!_service)
    throw new Error('CatalogService not initialized. Call setCatalogService before rendering.');
  return _service;
}
