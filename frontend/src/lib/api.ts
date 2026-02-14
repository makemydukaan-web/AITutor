// API utility functions with proper credential handling

export async function apiGet(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

export async function apiPost(url: string, data?: any) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response;
}

export async function apiPut(url: string, data?: any) {
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response;
}

export async function apiDelete(url: string) {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}
