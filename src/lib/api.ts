const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Error desconocido" }));
      const message =
        res.status === 429
          ? "Demasiadas solicitudes. Intentá de nuevo en unos minutos."
          : body.error || `Error ${res.status}`;
      throw new ApiError(message, res.status, body);
    }

    return res.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete(endpoint: string) {
    return this.request<void>(endpoint, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();
