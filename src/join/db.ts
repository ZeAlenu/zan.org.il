export interface JoinStatement {
  bind(...values: Array<string | number | null>): JoinStatement;
  first<T extends Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface JoinDatabase {
  prepare(sql: string): JoinStatement;
}
