import { randomUUID } from 'crypto';

export type Room = { id: string; name: string; total_capacity: number };

export type WorkingHours = {
  open: string; // HH:MM
  close: string; // HH:MM
  slots: string[]; // ["HH:MM", ...]
};

export type AvailabilityRequest = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  party_size: number;
  room_id?: string | null;
};

export type AvailabilityResponse = {
  available: boolean;
  rooms: Room[];
  suggestions: Array<{ time: string; room_id?: string | null; room_name?: string }>;
};

export type CreateReservationPayload = {
  customer_name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  party_size: number;
  reservation_type?: string;
  notes?: string;
  room_id?: string | null;
};

export type CreatedReservation = {
  id: string;
  status: string;
  room_name?: string;
  tables?: Array<{ table_name: string; capacity: number }>;
};

export type ApiClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  defaultTimeoutMs?: number;
  maxRetries?: number;
};

export class ReservationApiClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;

  constructor(options: ApiClientOptions = {}) {
    const envBase = process.env.RESERVATION_API_URL || '';
    const envKey = process.env.RESERVATION_API_KEY || '';

    this.baseUrl = (options.baseUrl || envBase).replace(/\/$/, '');
    this.apiKey = options.apiKey || envKey;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 8000;
    this.maxRetries = Math.max(0, options.maxRetries ?? 2);
  }

  private buildHeaders(extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
    if (extra) Object.assign(headers, extra);
    return headers;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<T> {
    if (!this.baseUrl) throw new Error('RESERVATION_API_URL not configured');
    if (!this.apiKey) throw new Error('RESERVATION_API_KEY not configured');

    const url = `${this.baseUrl}${path}`;

    // Merge headers and set Idempotency-Key if present
    const headers = this.buildHeaders(
      init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : undefined
    );

    const finalInit: RequestInit = {
      method: init.method || 'GET',
      headers,
      body: init.body,
    };

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= this.maxRetries) {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), this.defaultTimeoutMs);
        const res = await fetch(url, { ...finalInit, signal: ctrl.signal });
        clearTimeout(timeout);

        if (res.ok) {
          // handle 204
          if (res.status === 204) return {} as T;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return (await res.json()) as T;
          }
          const text = await res.text();
          try {
            return JSON.parse(text) as T;
          } catch (_e) {
            // Non-JSON
            return { raw: text } as unknown as T;
          }
        }

        // Retry on 429 or 5xx
        if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
          const retryAfter = Number(res.headers.get('retry-after') || 0);
          await this.sleep(this.backoffMs(attempt, retryAfter));
          attempt++;
          continue;
        }

        // Non-retryable error
        let errorBody: any = null;
        try {
          errorBody = await res.json();
        } catch {
          errorBody = await res.text();
        }
        throw new Error(
          `Reservation API error ${res.status}: ${typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)}`
        );
      } catch (err) {
        lastError = err;
        // Only retry on AbortError or fetch error
        if (attempt < this.maxRetries && this.isRetryableError(err)) {
          await this.sleep(this.backoffMs(attempt));
          attempt++;
          continue;
        }
        break;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private isRetryableError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as any).name;
      return name === 'AbortError' || name === 'FetchError';
    }
    return false;
  }

  private backoffMs(attempt: number, retryAfterSeconds = 0): number {
    if (retryAfterSeconds > 0) return retryAfterSeconds * 1000;
    const base = 300;
    const jitter = Math.floor(Math.random() * 200);
    return base * Math.pow(2, attempt) + jitter; // 300, ~800, ~1700...
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Public API
  async getRooms(): Promise<Room[]> {
    return this.request<Room[]>(`/api/chat/rooms`);
    }

  async getWorkingHours(date: string): Promise<WorkingHours> {
    // The spec shows two variants; support target_date for compatibility
    const qs = new URLSearchParams({ target_date: date }).toString();
    return this.request<WorkingHours>(`/api/chat/working-hours?${qs}`);
  }

  async checkAvailability(payload: AvailabilityRequest): Promise<AvailabilityResponse> {
    return this.request<AvailabilityResponse>(`/api/chat/availability`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createReservation(
    payload: CreateReservationPayload,
    opts?: { idempotencyKey?: string }
  ): Promise<CreatedReservation> {
    const idempotencyKey = opts?.idempotencyKey || randomUUID();
    return this.request<CreatedReservation>(`/api/chat/reservations`, {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey,
    });
  }
}

export function getReservationClient(options?: ApiClientOptions): ReservationApiClient {
  return new ReservationApiClient(options);
}
