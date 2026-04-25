export function getReadableError(error: unknown, fallback?: string): string {
  const safeFallback = fallback ?? 'Something went wrong. Please try again.';

  try {
    const anyErr = error as any;
    const apiMessage =
      anyErr?.response?.data?.message ??
      anyErr?.response?.data?.error ??
      anyErr?.data?.message ??
      null;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage.trim();
    }

    const message = anyErr?.message ?? null;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  } catch {
    // ignore
  }

  return safeFallback;
}

