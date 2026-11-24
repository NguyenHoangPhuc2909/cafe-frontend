import type { DailyRevenuePoint } from '../types/adminReport.ts';

export type RevenueGranularity = 'day' | 'week' | 'month';

export interface GroupedRevenuePoint {
  key: string;
  label: string;
  fullLabel: string;
  revenue: number;
  cashRevenue: number;
  bankTransferRevenue: number;
  paymentCount: number;
}

export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return day && month ? `${day}/${month}` : iso;
}

export function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return day && month && year ? `${day}/${month}/${year}` : iso;
}

export function defaultGranularity(dayCount: number): RevenueGranularity {
  if (dayCount > 90) return 'month';
  if (dayCount > 14) return 'week';
  return 'day';
}

function getIsoWeekBucketKey(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - mondayOffset);
  const y = String(utc.getUTCFullYear()).padStart(4, '0');
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function groupDailyRevenue(
  daily: DailyRevenuePoint[],
  granularity: RevenueGranularity,
  hideZero: boolean,
): GroupedRevenuePoint[] {
  let points: GroupedRevenuePoint[];

  if (granularity === 'day') {
    points = daily.map((item) => ({
      key: item.date,
      label: formatShortDate(item.date),
      fullLabel: formatFullDate(item.date),
      revenue: item.revenue,
      cashRevenue: item.cashRevenue,
      bankTransferRevenue: item.bankTransferRevenue,
      paymentCount: item.paymentCount,
    }));
  } else if (granularity === 'week') {
    const buckets = new Map<
      string,
      {
        startDate: string;
        endDate: string;
        revenue: number;
        cashRevenue: number;
        bankTransferRevenue: number;
        paymentCount: number;
      }
    >();

    for (const item of daily) {
      const weekKey = getIsoWeekBucketKey(item.date);
      const existing = buckets.get(weekKey);
      if (!existing) {
        buckets.set(weekKey, {
          startDate: item.date,
          endDate: item.date,
          revenue: item.revenue,
          cashRevenue: item.cashRevenue,
          bankTransferRevenue: item.bankTransferRevenue,
          paymentCount: item.paymentCount,
        });
      } else {
        existing.endDate = item.date;
        existing.revenue += item.revenue;
        existing.cashRevenue += item.cashRevenue;
        existing.bankTransferRevenue += item.bankTransferRevenue;
        existing.paymentCount += item.paymentCount;
      }
    }

    points = Array.from(buckets.entries()).map(([weekKey, bucket]) => {
      const sameDay = bucket.startDate === bucket.endDate;
      return {
        key: weekKey,
        label: sameDay
          ? formatShortDate(bucket.startDate)
          : `${formatShortDate(bucket.startDate)}–${formatShortDate(bucket.endDate)}`,
        fullLabel: sameDay
          ? formatFullDate(bucket.startDate)
          : `${formatFullDate(bucket.startDate)} – ${formatFullDate(bucket.endDate)}`,
        revenue: bucket.revenue,
        cashRevenue: bucket.cashRevenue,
        bankTransferRevenue: bucket.bankTransferRevenue,
        paymentCount: bucket.paymentCount,
      };
    });
  } else {
    const buckets = new Map<
      string,
      {
        revenue: number;
        cashRevenue: number;
        bankTransferRevenue: number;
        paymentCount: number;
      }
    >();

    for (const item of daily) {
      const monthKey = item.date.slice(0, 7);
      const existing = buckets.get(monthKey);
      if (!existing) {
        buckets.set(monthKey, {
          revenue: item.revenue,
          cashRevenue: item.cashRevenue,
          bankTransferRevenue: item.bankTransferRevenue,
          paymentCount: item.paymentCount,
        });
      } else {
        existing.revenue += item.revenue;
        existing.cashRevenue += item.cashRevenue;
        existing.bankTransferRevenue += item.bankTransferRevenue;
        existing.paymentCount += item.paymentCount;
      }
    }

    points = Array.from(buckets.entries()).map(([monthKey, bucket]) => {
      const [year, month] = monthKey.split('-');
      return {
        key: monthKey,
        label: `${month}/${year}`,
        fullLabel: `Tháng ${month}/${year}`,
        revenue: bucket.revenue,
        cashRevenue: bucket.cashRevenue,
        bankTransferRevenue: bucket.bankTransferRevenue,
        paymentCount: bucket.paymentCount,
      };
    });
  }

  return hideZero
    ? points.filter((point) => point.paymentCount > 0 || point.revenue > 0)
    : points;
}
