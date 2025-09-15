export async function api<T=any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  const js = await res.json();
  if (!res.ok) throw new Error(js?.error || 'api_error');
  return js as T;
}
