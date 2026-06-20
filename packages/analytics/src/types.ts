export interface TrackEventInput {
  userId?: string;
  eventType: string;
  module: string;
  action: string;
  metadata?: Record<string, unknown>;
  cost?: number;
  revenue?: number;
  duration?: number;
}

export interface UserDataSummary {
  todayGenerateCount: number;
  todayCost: number;
  todayRevenue: number;
  remainingPoints: number;
  recentEvents: Array<{
    eventType: string;
    module: string;
    action: string;
    createdAt: string;
  }>;
  modelUsage: Array<{ model: string; calls: number; successRate: number }>;
}

export interface DashboardOverview {
  todayRevenue: number;
  todayCost: number;
  todayProfit: number;
  todayActiveUsers: number;
  todayGenerateCount: number;
  dau: number;
  wau: number;
  mau: number;
  totalRevenue: number;
  arpu: number;
}

export interface FeatureAnalysisRow {
  module: string;
  usage: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ModelAnalysisRow {
  model: string;
  calls: number;
  success: number;
  fail: number;
  successRate: number;
  cost: number;
}

export interface UserAnalysisRow {
  userId: string;
  userLabel: string;
  generateCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface TemplateHotRow {
  templateId: string;
  name: string;
  usageCount: number;
  conversionRate: number;
}

export interface DataCenterDashboard {
  overview: DashboardOverview;
  features: FeatureAnalysisRow[];
  models: ModelAnalysisRow[];
  topUsers: UserAnalysisRow[];
  templateHot: TemplateHotRow[];
  insights: {
    mostProfitableFeature: string;
    mostExpensiveModel: string;
    highestValueUser: string;
    videoProfitable: boolean;
    batchProfitable: boolean;
  };
}
