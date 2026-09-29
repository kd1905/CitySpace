import { Agent, AgentStatus } from '@/types/agent';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'cityspace_agents_v1';

class AgentService {
  private agents: Agent[];
  private listeners: (() => void)[] = [];

  constructor() {
    this.agents = this.loadInitialAgents();
    this.refreshFromBackend();
  }

  /**
   * Subscribe to changes (add, edit, delete, status toggle, backend refresh)
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[AgentService] listener error:', err);
      }
    });
  }

  private loadInitialAgents(): Agent[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load stored agents from localStorage:', err);
      }
    }
    return [];
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.agents));
      } catch (err) {
        console.warn('Failed to save agents to localStorage:', err);
      }
    }
  }

  /**
   * Sync agents from SQL Database backend and notify subscribers
   */
  async refreshFromBackend(): Promise<Agent[]> {
    try {
      const res = await apiClient.get<Agent[]>('/agents');
      if (res.success && Array.isArray(res.data)) {
        this.agents = res.data;
        this.saveToStorage();
        this.notify();
      }
    } catch (err) {
      console.warn('[AgentService] Backend sync failed, using cached data:', err);
    }
    return [...this.agents];
  }

  /**
   * Get all agents (Admin only - includes inactive)
   */
  getAll(): Agent[] {
    return [...this.agents];
  }

  /**
   * Get active agents only (Public users)
   */
  getActive(): Agent[] {
    return this.agents.filter((a) => a.status === 'active');
  }

  /**
   * Get agent by ID
   */
  getById(id: string): Agent | undefined {
    return this.agents.find((a) => a.id === id);
  }

  /**
   * Get agent by email (for Agent authentication)
   */
  getByEmail(email: string): Agent | undefined {
    return this.agents.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Admin: Add new agent
   */
  async createAgent(
    data: Omit<Agent, 'id' | 'createdAt' | 'rating' | 'reviewCount'>
  ): Promise<Agent> {
    const newAgent: Agent = {
      ...data,
      id: `ag-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      activeListingsCount: data.assignedPropertyIds?.length || 0,
      createdAt: new Date().toISOString(),
    };
    this.agents.unshift(newAgent);
    this.saveToStorage();
    this.notify();

    // Persist to SQL database
    try {
      const res = await apiClient.post<Agent>('/agents', newAgent);
      if (res.success && res.data) {
        const idx = this.agents.findIndex((a) => a.id === newAgent.id);
        if (idx !== -1) {
          this.agents[idx] = res.data;
          this.saveToStorage();
          this.notify();
        }
      }
    } catch (err) {
      console.warn('[AgentService] Failed to persist new agent to backend:', err);
    }

    return newAgent;
  }

  /**
   * Admin: Edit agent
   */
  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    const agent = this.agents.find((a) => a.id === id);
    if (!agent) return null;
    Object.assign(agent, updates);
    this.saveToStorage();
    this.notify();

    // Persist update to SQL database
    try {
      const res = await apiClient.put<Agent>(`/agents/${id}`, updates);
      if (res.success && res.data) {
        const idx = this.agents.findIndex((a) => a.id === id);
        if (idx !== -1) {
          this.agents[idx] = res.data;
          this.saveToStorage();
          this.notify();
        }
      }
    } catch (err) {
      console.warn(`[AgentService] Failed to update agent ${id} on backend:`, err);
    }

    return agent;
  }

  /**
   * Admin: Activate / Deactivate agent
   */
  async toggleStatus(id: string): Promise<Agent | null> {
    const agent = this.agents.find((a) => a.id === id);
    if (!agent) return null;
    agent.status = agent.status === 'active' ? 'inactive' : 'active';
    this.saveToStorage();
    this.notify();

    // Persist status toggle to SQL database
    try {
      const res = await apiClient.patch<Agent>(`/agents/${id}/status`);
      if (res.success && res.data) {
        const idx = this.agents.findIndex((a) => a.id === id);
        if (idx !== -1) {
          this.agents[idx] = res.data;
          this.saveToStorage();
          this.notify();
        }
      }
    } catch (err) {
      console.warn(`[AgentService] Failed to toggle agent status on backend:`, err);
    }

    return agent;
  }

  /**
   * Admin: Delete agent
   */
  async deleteAgent(id: string): Promise<boolean> {
    const idx = this.agents.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.agents.splice(idx, 1);
      this.saveToStorage();
      this.notify();
    }

    // Delete from SQL database
    try {
      await apiClient.delete(`/agents/${id}`);
    } catch (err) {
      console.warn(`[AgentService] Failed to delete agent ${id} from backend:`, err);
    }

    return true;
  }

  /**
   * Admin: Assign property to agent
   */
  assignProperty(agentId: string, propertyId: string): boolean {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return false;
    if (!agent.assignedPropertyIds) {
      agent.assignedPropertyIds = [];
    }
    if (!agent.assignedPropertyIds.includes(propertyId)) {
      agent.assignedPropertyIds.push(propertyId);
      agent.activeListingsCount = agent.assignedPropertyIds.length;
      this.saveToStorage();
      this.notify();
    }
    return true;
  }
}

export const agentService = new AgentService();
