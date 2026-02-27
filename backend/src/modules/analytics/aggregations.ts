import mongoose, { PipelineStage } from 'mongoose';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsFilters extends DateRange {
  companyId?: string;
}

/**
 * Build date range filter for aggregation pipelines
 */
export function buildDateFilter(filters: DateRange): Record<string, unknown> {
  const dateFilter: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (filters.startDate) {
      createdAtFilter.$gte = filters.startDate;
    }
    if (filters.endDate) {
      createdAtFilter.$lte = filters.endDate;
    }
    dateFilter.createdAt = createdAtFilter;
  }

  return dateFilter;
}

/**
 * Build base match stage for aggregation pipelines
 */
export function buildBaseMatch(filters: AnalyticsFilters): Record<string, unknown> {
  const match: Record<string, unknown> = {
    deletedAt: null,
  };

  if (filters.companyId) {
    match.companyId = new mongoose.Types.ObjectId(filters.companyId);
  }

  const dateFilter = buildDateFilter(filters);
  if (Object.keys(dateFilter).length > 0) {
    Object.assign(match, dateFilter);
  }

  return match;
}

/**
 * Purchase Requests Aggregation Pipelines
 */
export const purchaseRequestAggregations = {
  /**
   * Get KPIs: total count, by status, by month
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match = buildBaseMatch(filters);

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m', date: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                month: '$_id',
                count: 1,
              },
            },
            { $sort: { month: 1 } },
          ],
        },
      },
    ];
  },
};

/**
 * Contracts Aggregation Pipelines
 */
export const contractAggregations = {
  /**
   * Get KPIs: total count, by status, total value, average value
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.companyId) {
      match.buyerCompanyId = new mongoose.Types.ObjectId(filters.companyId);
    }

    const dateFilter = buildDateFilter(filters);
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(match, dateFilter);
    }

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],
          valueStats: [
            {
              $group: {
                _id: null,
                totalValue: { $sum: '$amounts.total' },
                averageValue: { $avg: '$amounts.total' },
                count: { $sum: 1 },
              },
            },
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m', date: '$createdAt' },
                },
                count: { $sum: 1 },
                value: { $sum: '$amounts.total' },
              },
            },
            {
              $project: {
                _id: 0,
                month: '$_id',
                count: 1,
                value: 1,
              },
            },
            { $sort: { month: 1 } },
          ],
        },
      },
    ];
  },
};

/**
 * Bids Aggregation Pipelines
 */
export const bidAggregations = {
  /**
   * Get KPIs: total count, by status, acceptance rate, average AI score
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match = buildBaseMatch(filters);

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],
          stats: [
            {
              $group: {
                _id: null,
                totalSubmitted: {
                  $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] },
                },
                totalAccepted: {
                  $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
                },
                totalBids: { $sum: 1 },
                averageAIScore: { $avg: '$aiScore' },
                totalBidValue: { $sum: '$price' },
                averageBidValue: { $avg: '$price' },
              },
            },
          ],
        },
      },
    ];
  },
};

/**
 * Payments Aggregation Pipelines
 */
export const paymentAggregations = {
  /**
   * Get KPIs: total amount, by status, pending amount
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.companyId) {
      match.$or = [
        { companyId: new mongoose.Types.ObjectId(filters.companyId) },
        { recipientCompanyId: new mongoose.Types.ObjectId(filters.companyId) },
      ];
    }

    const dateFilter = buildDateFilter(filters);
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(match, dateFilter);
    }

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
                amount: 1,
              },
            },
          ],
          stats: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                pendingAmount: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['pending_approval', 'approved'],
                        ],
                      },
                      '$amount',
                      0,
                    ],
                  },
                },
                completedAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
                  },
                },
              },
            },
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m', date: '$createdAt' },
                },
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
            {
              $project: {
                _id: 0,
                month: '$_id',
                count: 1,
                amount: 1,
              },
            },
            { $sort: { month: 1 } },
          ],
        },
      },
    ];
  },
};

/**
 * Disputes Aggregation Pipelines
 */
export const disputeAggregations = {
  /**
   * Get KPIs: total count, escalated count, resolution rate
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match = buildBaseMatch(filters);

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                escalated: {
                  $sum: {
                    $cond: ['$escalatedToGovernment', 1, 0],
                  },
                },
                resolved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
                  },
                },
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                type: '$_id',
                count: 1,
              },
            },
          ],
        },
      },
    ];
  },
};

/**
 * Companies Aggregation Pipelines
 */
export const companyAggregations = {
  /**
   * Get KPIs: by type, active count
   */
  getKPIs: (filters: DateRange) => {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    const dateFilter = buildDateFilter(filters);
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(match, dateFilter);
    }

    return [
      { $match: match },
      {
        $facet: {
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                type: '$_id',
                count: 1,
              },
            },
          ],
          active: [
            {
              $match: { status: 'APPROVED' },
            },
            {
              $count: 'count',
            },
          ],
        },
      },
    ];
  },
};

/**
 * RFQs Aggregation Pipelines
 */
export const rfqAggregations = {
  /**
   * Get KPIs: total count, by status, by type
   */
  getKPIs: (filters: AnalyticsFilters): PipelineStage[] => {
    const match = buildBaseMatch(filters);

    return [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                type: '$_id',
                count: 1,
              },
            },
          ],
        },
      },
    ];
  },
};
