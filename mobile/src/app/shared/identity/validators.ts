// Presentation checks mirror the contract. The API remains the authority.
export function passwordValid(value: string) {
  return (
    [...value].length >= 12 &&
    [...value].length <= 128 &&
    !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)
  );
}
export function safeAvatar(url: string | undefined) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1')
      ? url
      : '';
  } catch {
    return '';
  }
}
