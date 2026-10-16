import type { AnalyticsQuery, AnalyticsResponse } from "@/type/admin/Analytics"

import { api } from "../axios"

export const getAnalytics = async ({
  period,

  from,

  to,
}: AnalyticsQuery): Promise<AnalyticsResponse> => {
  const response = await api.get("/admin/reports/overview", {
    params: {
      period,

      ...(period === "custom" && {
        dateFrom: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,

        dateTo: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      }),
    },
  })

  return response.data
}
