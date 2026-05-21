/**
 * Prefer API data; never inject client-side mock rows in production UI.
 */
export function preferApi<T>(api: T[] | null | undefined): T[] {
  return api ?? [];
}

export function preferApiOrEmpty<T>(api: T[] | null | undefined, _legacyMock?: T[]): T[] {
  void _legacyMock;
  return preferApi(api);
}
