export interface MetricsSummary {
    timestamp: string;
    institutionId?: string;
    serviceType?: string;
    gateway?: string;
    totalVolume: number;
    successRate: number;
    timeoutRate: number;
    failureRate: number;
    systemicFailureRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    topErrorCodes: Record<string, number>;
}

export interface AlertEvent {
  id: string;
  type: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
  timestamp: string;
}
