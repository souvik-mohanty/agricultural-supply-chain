// Turns any failed request into a sentence a user can act on. Never shows stack traces or raw server output.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) {
    return fallback;
  }

  const response = error.response;
  if (!response) {
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
      return 'The server took too long to respond. Please try again.';
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    return error.message || fallback;
  }

  // The backend always answers { timestamp, status, error, message, path }.
  const serverMessage = response.data && typeof response.data === 'object' ? response.data.message : undefined;

  switch (response.status) {
    case 400:
    case 422:
      return serverMessage || 'Some of the information you entered is not valid.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return serverMessage && /suspended/i.test(serverMessage)
        ? serverMessage
        : 'You do not have permission to do that.';
    case 404:
      return serverMessage || 'We could not find what you asked for.';
    case 409:
      return serverMessage || 'That is not possible in the current state.';
    case 413:
      return 'The uploaded file is too large.';
    case 503:
      return serverMessage || 'This service is temporarily unavailable. Please try again later.';
    default:
      return response.status >= 500 ? 'The server ran into a problem. Please try again shortly.' : serverMessage || fallback;
  }
};

export const isUnauthorized = (error) => error?.response?.status === 401;

// Retrying a request that failed with a 4xx will not help.
export const shouldRetry = (failureCount, error) => {
  const status = error?.response?.status;
  if (status && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 2;
};
