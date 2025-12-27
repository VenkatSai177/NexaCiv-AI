
import { IncidentCase, CaseStatus, UserProfile, ADMIN_ALLOW_LIST } from './types';

const CASES_KEY = 'global_incident_log';
const OFFLINE_QUEUE_KEY = 'civic_offline_queue';
const AUTH_KEY = 'dlxcg_auth_session';
const ADMIN_LOGS_KEY = 'admin_audit_trail'; 

export interface AdminActionLog {
  id: string;
  caseId: string;
  action: string;
  admin: string;
  timestamp: number;
  details: any;
}

export const firebaseService = {
  // --- Enhanced Auth Simulation ---
  async loginWithGoogle(isAdmin: boolean = false, emailInput?: string): Promise<UserProfile> {
    // In a real app, this would be the email returned from Google OAuth
    const email = emailInput || (isAdmin ? 'admin@disasterlens.gov' : 'citizen@civicguard.org');
    
    if (isAdmin && !ADMIN_ALLOW_LIST.includes(email)) {
      throw new Error(`ACCESS_DENIED: ${email} is not authorized for Strategic Command access.`);
    }

    const profile: UserProfile = {
      uid: isAdmin ? 'uid-admin-' + Math.random().toString(36).substr(2, 5) : 'uid-citizen-' + Math.random().toString(36).substr(2, 5),
      email: email,
      displayName: isAdmin ? 'Strategic Ops Commander' : 'Civic Participant',
      role: isAdmin ? 'ADMIN' : 'CITIZEN'
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
    return profile;
  },

  async loginAsGuest(): Promise<UserProfile> {
    const profile: UserProfile = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 5),
      email: null,
      displayName: 'Guest Reporter',
      role: 'GUEST'
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
    return profile;
  },

  getCurrentUser(): UserProfile | null {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  // --- Real-time Data Operations ---
  async getCases(cityFilter?: string): Promise<IncidentCase[]> {
    const data = localStorage.getItem(CASES_KEY);
    let cases: IncidentCase[] = data ? JSON.parse(data) : [];
    if (cityFilter && cityFilter !== 'ALL') {
      cases = cases.filter(c => c.city === cityFilter);
    }
    return cases.sort((a, b) => b.timestamp - a.timestamp);
  },

  async saveCase(incident: IncidentCase): Promise<void> {
    const cases = await this.getCases();
    
    const processedIncident = {
      ...incident,
      integrityChecksum: Math.random().toString(36).substring(7), 
      deviceFingerprint: navigator.userAgent + "-SECURE-FINGERPRINT",
    };

    const existingIndex = cases.findIndex(c => c.id === incident.id);
    if (existingIndex > -1) {
      cases[existingIndex] = processedIncident;
    } else {
      cases.push(processedIncident);
    }
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
    this.dispatchAlerts(processedIncident);
  },

  async updateCaseStatus(id: string, status: CaseStatus, user: string, remarks?: string): Promise<void> {
    const cases = await this.getCases();
    const incident = cases.find(c => c.id === id);
    if (incident) {
      const oldStatus = incident.status;
      incident.status = status;
      if (remarks) incident.remarks = remarks;
      incident.history.push({ status, timestamp: Date.now(), user });
      localStorage.setItem(CASES_KEY, JSON.stringify(cases));
      
      await this.logAdminAction(id, 'STATUS_UPDATE', user, {
        previousStatus: oldStatus,
        newStatus: status,
        remarks: remarks || 'No remarks provided'
      });
    }
  },

  async logAdminAction(caseId: string, action: string, admin: string, details: any): Promise<void> {
    const logs: AdminActionLog[] = JSON.parse(localStorage.getItem(ADMIN_LOGS_KEY) || '[]');
    const newLog: AdminActionLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      caseId,
      action,
      admin,
      timestamp: Date.now(),
      details
    };
    logs.push(newLog);
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs));
  },

  async getAdminLogs(caseId?: string): Promise<AdminActionLog[]> {
    const logs: AdminActionLog[] = JSON.parse(localStorage.getItem(ADMIN_LOGS_KEY) || '[]');
    if (caseId) return logs.filter(l => l.caseId === caseId);
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  },

  async queueOfflineReport(incident: IncidentCase) {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(incident);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  async syncOfflineQueue() {
    if (!navigator.onLine) return 0;
    const queue: IncidentCase[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return 0;

    for (const incident of queue) {
      await this.saveCase(incident);
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');
    return queue.length;
  },

  dispatchAlerts(incident: IncidentCase) {
    if (incident.analysis.riskLevel === 'CRITICAL') {
      console.warn(`[SMS/EMAIL ALERT] EMERGENCY: CRITICAL ${incident.analysis.hazardType} in ${incident.city}.`);
    }
  }
};
