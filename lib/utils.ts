export function exclude<T, Key extends keyof T>(
  resultSet: T,
  ...keys: Key[]
): Omit<T, Key> {
  for (let key of keys) {
    delete resultSet[key];
  }
  return resultSet;
}
