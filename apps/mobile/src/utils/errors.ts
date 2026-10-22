import axios from 'axios';

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error?.message;
    if (serverMessage && typeof serverMessage === 'string') {
      return serverMessage;
    }
    if (error.message === 'Network Error') {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
