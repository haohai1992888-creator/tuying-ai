export interface BetaUserDto {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  points: number;
  betaPoints: number;
  betaUser: boolean;
  betaExpireAt: string | null;
  status: string;
  createdAt: string;
}

export interface InviteCodeDto {
  id: string;
  code: string;
  maxCount: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  usages?: Array<{ id: string; userId: string; userLabel: string; createdAt: string }>;
}

export interface FeedbackDto {
  id: string;
  userId: string;
  userLabel: string;
  category: string;
  content: string;
  status: string;
  adminReply: string | null;
  taskId: string | null;
  model: string | null;
  error: string | null;
  prompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  enabled: boolean;
  createdAt: string;
}

export interface BetaDashboardStats {
  betaUserCount: number;
  activeBetaUsers: number;
  generateCount: number;
  avgCost: number;
  modelShare: Array<{ model: string; percent: number; cost: number }>;
  failureRate: number;
}

export interface CostCenterStats {
  gptCost: number;
  seedreamCost: number;
  geminiCost: number;
  totalCost: number;
  userRanking: Array<{
    userId: string;
    userLabel: string;
    cost: number;
    generateCount: number;
  }>;
}

export interface BehaviorStats {
  topFeatures: Array<{ action: string; module: string; count: number }>;
}

export interface BetaReport {
  generatedAt: string;
  userCount: number;
  betaUserCount: number;
  activeRate: number;
  paymentIntentRate: number;
  modelCost: {
    gpt: number;
    seedream: number;
    gemini: number;
    total: number;
  };
  topIssues: Array<{ category: string; count: number }>;
  topTemplates: Array<{ name: string; usageCount: number }>;
  topFeatures: Array<{ label: string; count: number }>;
}
