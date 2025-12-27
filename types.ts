
export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW',
  NEGLIGIBLE = 'NEGLIGIBLE'
}

export enum CaseStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  INVESTIGATING = 'INVESTIGATING',
  ASSIGNED = 'ASSIGNED',
  ACTION_IN_PROGRESS = 'ACTION_IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
  ESCALATED = 'ESCALATED',
  FALSE_REPORT = 'FALSE_REPORT'
}

// Source engines strictly mapped to the 3 submission modules
export type SourceEngine = 'DISASTER_AI' | 'CIVIC_GUARD' | 'EVIDENCE_HUB';

export type EvidenceType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface AIRiskAnalysis {
  hazardType: string;
  riskLevel: RiskLevel;
  confidenceScore: number;
  impactSeverity: number; // 1-10
  impactRadius: string;
  safetyRecommendation: string[];
  humanReadableExplanation: string;
  riskFactors: string[];
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
  detectedObjects?: string[];
  misconductPatterns?: string[];
  sentimentScore?: number; // -1 to 1
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  region?: string;
  address?: string;
}

export interface IncidentCase {
  id: string;
  timestamp: number;
  sourceEngine: SourceEngine;
  imageUrl?: string;
  videoUrl?: string;
  evidenceType: EvidenceType;
  location: GeoLocation;
  analysis: AIRiskAnalysis;
  status: CaseStatus;
  responder?: string;
  remarks?: string;
  city: string;
  isAnonymous: boolean;
  reporterId?: string;
  integrityChecksum: string;
  deviceFingerprint: string;
  history: { status: CaseStatus; timestamp: number; user: string }[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'ADMIN' | 'CITIZEN' | 'GUEST';
}

export const SUPPORTED_CITIES = [
  'Visakhapatnam',
  'Hyderabad',
  'Bangalore',
  'Mumbai',
  'San Francisco'
];

export const ADMIN_ALLOW_LIST = [
  'admin@disasterlens.gov',
  'ops@civicguard.org'
];
