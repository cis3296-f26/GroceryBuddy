export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function createApiClient({ getSession, fetch: request = (...args) => fetch(...args) }) {
  return async function api(path, { method = 'GET', body, signal } = {}) {
    // Supabase refreshes expired access tokens through getSession before a request.
    const { data, error } = await getSession()
    if (error || !data?.session?.access_token) throw new ApiError('Please sign in to manage your groceries.', 401)
    const response = await request(`/api/${path}`, {
      method, signal,
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    if (response.status === 204 && response.ok) return null
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new ApiError('The grocery service could not be reached. Please try again.', response.status)
    }
    const payload = await response.json()
    if (!response.ok) {
      const detail = payload?.detail || Object.entries(payload || {}).map(([key, value]) => `${key}: ${value}`).join(' ')
      throw new ApiError(detail || 'Could not save your groceries. Please try again.', response.status)
    }
    return payload
  }
}
