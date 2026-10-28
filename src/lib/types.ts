// Shared TypeScript types mirroring development/API_CONTRACT.md response shapes.

export type Role = "STUDENT" | "GURU" | "ADMIN";

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

export interface GuruSummary {
  userId: number;
  fullName: string;
  headline: string | null;
  categoryName: string | null;
  skills: string[];
  ratingAvg: number | null;
  ratingCount: number;
  city: string | null;
  country: string | null;
}

export interface GuruDetail extends GuruSummary {
  bio: string | null;
  hourlyRate: string | null;
  fixedRateMin: string | null;
  fixedRateMax: string | null;
  introVideoUrl: string | null;
  email?: string;
}

export type BudgetType = "FIXED_MILESTONES" | "FIXED_FULL_PAY";

export type RequirementStatus = "OPEN" | "IN_CONTRACT" | "CLOSED" | "CANCELLED";

export interface Requirement {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  categoryId: number;
  categoryName: string;
  description: string;
  budgetType: BudgetType;
  budgetAmount: string;
  status: RequirementStatus;
  createdAt: string;
  proposalCount?: number;
}

export type ProposalStatus = "PENDING" | "SHORTLISTED" | "ACCEPTED" | "DECLINED";

export interface Proposal {
  id: number;
  requirementId: number;
  requirementTitle?: string;
  requirementStatus?: string;
  guruId: number;
  guruName?: string;
  coverLetter: string;
  proposedAmount: string;
  status: ProposalStatus;
  createdAt: string;
  contractId?: number;
}

export type ContractStatus = "ACTIVE" | "COMPLETED" | "ENDED";

export interface Contract {
  id: number;
  requirementId: number;
  requirementTitle: string;
  studentId: number;
  studentName: string;
  guruId: number;
  guruName: string;
  status: string;
  createdAt: string;
  milestones?: Milestone[];
}

export type MilestoneStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUBMITTED"
  | "RELEASED"
  | "REJECTED";

export interface Milestone {
  id: number;
  contractId: number;
  name: string;
  amount: string;
  startDate: string | null;
  endDate: string | null;
  status: MilestoneStatus;
  createdById: number;
  commissionPct: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionBand {
  id: number;
  minAmount: string;
  maxAmount: string | null;
  ratePct: string;
}

export interface CommissionCalculation {
  amount: string;
  ratePct: string;
  commission: string;
  net: string;
  band: { minAmount: string; maxAmount: string | null };
}

export interface WalletTransaction {
  id: number;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: string;
  description?: string | null;
  milestoneId?: number | null;
  createdAt: string;
}

export interface WalletMe {
  balance: string;
  transactions: {
    items: WalletTransaction[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ConversationSummary {
  id: number;
  otherUser: { id: number; fullName: string; role: Role };
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export type MessageType = "TEXT" | "MEETING_SCHEDULED" | "MEETING_CANCELLED";

export interface Meeting {
  id: number;
  conversationId: number;
  createdById: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeZone: string;
  status: "SCHEDULED" | "CANCELLED";
  meetUrl: string | null;
  calendarUrl: string | null;
  cancelledById: number | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  type: MessageType;
  body: string;
  meeting: Meeting | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
