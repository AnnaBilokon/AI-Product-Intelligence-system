import type {
  AnalysisRequest,
  AnalysisResponse,
  ProductOverviewResponse,
  CustomerDetailResponse,
  CustomerListItem,
  CustomerReportResponse,
  HealthResponse,
  StatsResponse,
  UploadResponse,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    let detail = fallbackMessage;

    try {
      const data = (await response.json()) as { detail?: string };
      detail = data.detail || fallbackMessage;
    } catch {
      detail = fallbackMessage;
    }

    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>("/stats");
}

export function getOverview(): Promise<ProductOverviewResponse> {
  return request<ProductOverviewResponse>("/overview");
}

export function uploadFeedback(formData: FormData): Promise<UploadResponse> {
  return request<UploadResponse>("/feedback/upload", {
    method: "POST",
    body: formData,
  });
}

export function runAnalysis(payload: AnalysisRequest): Promise<AnalysisResponse> {
  return request<AnalysisResponse>("/analysis/run", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateCustomerReport(
  customer: string,
): Promise<CustomerReportResponse> {
  return request<CustomerReportResponse>("/customer/report", {
    method: "POST",
    body: JSON.stringify({ customer }),
  });
}

export function getCustomers(): Promise<CustomerListItem[]> {
  return request<CustomerListItem[]>("/customers");
}

export function getCustomerDetail(
  customer: string,
): Promise<CustomerDetailResponse> {
  return request<CustomerDetailResponse>(
    `/customers/${encodeURIComponent(customer)}`,
  );
}

export function clearCollection(): Promise<{
  message: string;
  cleared_chunks: number;
}> {
  return request<{ message: string; cleared_chunks: number }>("/clear", {
    method: "POST",
  });
}