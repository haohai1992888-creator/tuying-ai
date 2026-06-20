import type { AIProviderId, TaskComplexity, TaskType, UserLevel } from "../enums";

export interface RouteInput {
  taskType: TaskType | string;
  complexity: TaskComplexity | string;
  userLevel: UserLevel | string;
  category?: string;
  userBalance?: number;
  taskCost?: number;
  preferredProvider?: string;
  userRole?: string;
  userPlan?: string;
}

export interface RouteResult {
  provider: AIProviderId | string;
  reason?: string;
  fallbackChain?: string[];
  score?: number;
}

export interface ModelScoreEntry {
  quality: number;
  speed: number;
  cost: number;
}

export type ModelScoreMap = Record<string, ModelScoreEntry>;

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  next?: string | null;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version?: string;
  nodes: WorkflowNodeDefinition[] | string[];
}

export interface WorkflowContext {
  taskId: string;
  userId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  variables: Record<string, unknown>;
  /** @deprecated use variables */
  payload?: Record<string, unknown>;
  /** @deprecated use variables */
  vars?: Record<string, unknown>;
}

export interface JwtPayload {
  sub: string;
  role: string;
  type: "access" | "refresh";
}

export interface StorageUploadInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
}

export interface PaymentOrderInput {
  orderNo: string;
  userId: string;
  amount: number;
  points: number;
  subject: string;
  notifyUrl: string;
  returnUrl?: string;
}

export interface PaymentOrderResult {
  orderNo: string;
  status: string;
  payUrl?: string;
  paymentParams?: Record<string, unknown>;
}

export interface PaymentQueryResult {
  orderNo: string;
  status: "PENDING" | "PAID" | "CLOSED" | "REFUNDED";
  externalTradeNo?: string;
  paidAt?: string;
}

export interface PaymentCallbackPayload {
  orderNo: string;
  externalTradeNo: string;
  amount: number;
  success: boolean;
}

export interface PaymentRefundResult {
  success: boolean;
  message: string;
}
