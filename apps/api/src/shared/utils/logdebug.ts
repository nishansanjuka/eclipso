export function logDebug(message: unknown, ...optionalParams: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(message, ...optionalParams);
  }
}
