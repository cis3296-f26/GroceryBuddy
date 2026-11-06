let csrfToken = ''

export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRFToken': csrfToken } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || (data ? Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(' ') : 'Request failed. Please sign in again or check the backend.'))
  }
  if (data?.csrfToken) csrfToken = data.csrfToken
  return data
}
