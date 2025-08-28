import { apiClient } from '../client';
import {
  WorkflowApiResponse,
  TeamInfo,
  TeamsResponse,
  CreateTeamRequest,
  UpdateTeamRequest
} from './types';

export const teamsApi = {
  // Get all teams with optional filtering
  getTeams: async (params?: {
    department?: string;
    center?: string;
    region?: string;
    isActive?: boolean;
    teamleadAgentId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<TeamsResponse> => {
    const response = await apiClient.get<WorkflowApiResponse<TeamsResponse>>(
      '/workflow/teams',
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch teams');
    }
    
    return response.data.data;
  },

  // Get team by ID
  getTeamById: async (teamId: string): Promise<TeamInfo> => {
    const response = await apiClient.get<WorkflowApiResponse<TeamInfo>>(
      `/workflow/teams/${teamId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch team');
    }
    
    return response.data.data;
  },

  // Create a new team
  createTeam: async (teamData: CreateTeamRequest): Promise<TeamInfo> => {
    const response = await apiClient.post<WorkflowApiResponse<TeamInfo>>(
      '/workflow/teams',
      teamData
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create team');
    }
    
    return response.data.data;
  },

  // Update an existing team
  updateTeam: async (teamId: string, teamData: UpdateTeamRequest): Promise<TeamInfo> => {
    const response = await apiClient.put<WorkflowApiResponse<TeamInfo>>(
      `/workflow/teams/${teamId}`,
      teamData
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update team');
    }
    
    return response.data.data;
  },

  // Delete a team (soft delete)
  deleteTeam: async (teamId: string): Promise<TeamInfo> => {
    const response = await apiClient.delete<WorkflowApiResponse<TeamInfo>>(
      `/workflow/teams/${teamId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete team');
    }
    
    return response.data.data;
  },

  // Get teams by team lead agent ID
  getTeamsByTeamlead: async (teamleadAgentId: string): Promise<TeamInfo[]> => {
    const response = await apiClient.get<WorkflowApiResponse<TeamInfo[]>>(
      `/workflow/teams/by-teamlead/${teamleadAgentId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch teams by team lead');
    }
    
    return response.data.data;
  },

  // Map a team to a campaign
  mapTeamToCampaign: async (teamId: string, campaignId: string): Promise<any> => {
    const response = await apiClient.post<WorkflowApiResponse<any>>(
      `/workflow/teams/${teamId}/campaigns/${campaignId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to map team to campaign');
    }
    
    return response.data.data;
  },

  // Remove mapping between a team and a campaign
  removeTeamFromCampaign: async (teamId: string, campaignId: string): Promise<void> => {
    const response = await apiClient.delete<WorkflowApiResponse<void>>(
      `/workflow/teams/${teamId}/campaigns/${campaignId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove team-campaign mapping');
    }
  },

  // Get all campaigns mapped to a team
  getTeamCampaigns: async (teamId: string, isActive?: boolean): Promise<any[]> => {
    const params = isActive !== undefined ? { isActive } : {};
    const response = await apiClient.get<WorkflowApiResponse<any[]>>(
      `/workflow/teams/${teamId}/campaigns`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch team campaigns');
    }
    
    return response.data.data;
  }
};