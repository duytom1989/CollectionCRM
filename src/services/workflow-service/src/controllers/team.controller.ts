import { Request, Response, NextFunction } from 'express';
import { TeamRepository } from '../repositories/team.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Team controller
 */
export class TeamController {
  /**
   * Get all teams with optional filtering
   * @route GET /teams
   */
  async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { department, center, region, isActive, teamleadAgentId, page = 1, pageSize = 10 } = req.query;
      
      const result = await TeamRepository.searchTeams({
        department: department as string,
        center: center as string,
        region: region as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        teamleadAgentId: teamleadAgentId as string,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          teams: result.items,
          pagination: result.pagination
        },
        'Teams retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting teams');
      next(error);
    }
  }
  
  /**
   * Create a new team
   * @route POST /teams
   */
  async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, teamleadAgentId, department, center, region } = req.body;
      
      // Validate required fields
      if (!name || !teamleadAgentId || !department || !center || !region) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Check if team with same name already exists
      const existingTeam = await TeamRepository.findByName(name);
      if (existingTeam) {
        throw Errors.create(
          Errors.Database.DUPLICATE_RECORD,
          `Team with name ${name} already exists`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Check if team lead agent exists and is active
      const teamleadAgent = await AgentRepository.findById(teamleadAgentId);
      if (!teamleadAgent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team lead agent with ID ${teamleadAgentId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      if (!teamleadAgent.isActive) {
        throw Errors.create(
          Errors.Validation.INVALID_VALUE,
          `Team lead agent with ID ${teamleadAgentId} is not active`,
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create team
      const team = await TeamRepository.createTeam({
        name,
        description,
        teamleadAgentId,
        department,
        center,
        region,
        isActive: true,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ teamId: team.id }, 'Team created successfully');
      
      return ResponseUtil.success(
        res,
        team,
        'Team created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating team');
      next(error);
    }
  }
  
  /**
   * Update an existing team
   * @route PUT /teams/:id
   */
  async updateTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, teamleadAgentId, department, center, region, isActive } = req.body;
      
      // Find team
      const team = await TeamRepository.findById(id);
      
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // If team lead agent is being updated, validate it exists and is active
      if (teamleadAgentId && teamleadAgentId !== team.teamleadAgentId) {
        const teamleadAgent = await AgentRepository.findById(teamleadAgentId);
        if (!teamleadAgent) {
          throw Errors.create(
            Errors.Database.RECORD_NOT_FOUND,
            `Team lead agent with ID ${teamleadAgentId} not found`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
        
        if (!teamleadAgent.isActive) {
          throw Errors.create(
            Errors.Validation.INVALID_VALUE,
            `Team lead agent with ID ${teamleadAgentId} is not active`,
            OperationType.VALIDATION,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // If name is being updated, check for uniqueness
      if (name && name !== team.name) {
        const existingTeam = await TeamRepository.findByName(name);
        if (existingTeam) {
          throw Errors.create(
            Errors.Database.DUPLICATE_RECORD,
            `Team with name ${name} already exists`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Update team
      const updatedTeam = await TeamRepository.updateTeam(id, {
        name,
        description,
        teamleadAgentId,
        department,
        center,
        region,
        isActive,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ teamId: id }, 'Team updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedTeam,
        'Team updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating team');
      next(error);
    }
  }
  
  /**
   * Get team by ID
   * @route GET /teams/:id
   */
  async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const team = await TeamRepository.findById(id);
      
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        team,
        'Team retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting team');
      next(error);
    }
  }
  
  /**
   * Delete a team (soft delete)
   * @route DELETE /teams/:id
   */
  async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Find team
      const team = await TeamRepository.findById(id);
      
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Soft delete team
      const deletedTeam = await TeamRepository.deleteTeam(id);
      
      logger.info({ teamId: id }, 'Team deleted successfully');
      
      return ResponseUtil.success(
        res,
        deletedTeam,
        'Team deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting team');
      next(error);
    }
  }
  
  /**
   * Get teams by team lead agent ID
   * @route GET /teams/by-teamlead/:teamleadAgentId
   */
  async getTeamsByTeamlead(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamleadAgentId } = req.params;
      
      const teams = await TeamRepository.findByTeamleadAgentId(teamleadAgentId);
      
      return ResponseUtil.success(
        res,
        teams,
        'Teams retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting teams by team lead');
      next(error);
    }
  }
  
  /**
   * Map a team to a campaign
   * @route POST /teams/:teamId/campaigns/:campaignId
   */
  async mapTeamToCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId, campaignId } = req.params;
      
      // Validate team exists
      const team = await TeamRepository.findById(teamId);
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${teamId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Check if mapping already exists
      const existingMapping = await TeamRepository.findTeamCampaignMapping(teamId, campaignId);
      if (existingMapping) {
        throw Errors.create(
          Errors.Database.DUPLICATE_RECORD,
          `Team ${teamId} is already mapped to campaign ${campaignId}`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create mapping
      const mapping = await TeamRepository.createTeamCampaignMapping({
        teamId,
        campaignId,
        isActive: true,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ teamId, campaignId }, 'Team mapped to campaign successfully');
      
      return ResponseUtil.success(
        res,
        mapping,
        'Team mapped to campaign successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error mapping team to campaign');
      next(error);
    }
  }
  
  /**
   * Remove mapping between a team and a campaign
   * @route DELETE /teams/:teamId/campaigns/:campaignId
   */
  async removeTeamFromCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId, campaignId } = req.params;
      
      // Check if mapping exists
      const mapping = await TeamRepository.findTeamCampaignMapping(teamId, campaignId);
      if (!mapping) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Mapping between team ${teamId} and campaign ${campaignId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Remove mapping
      await TeamRepository.deleteTeamCampaignMapping(teamId, campaignId);
      
      logger.info({ teamId, campaignId }, 'Team-campaign mapping removed successfully');
      
      return ResponseUtil.success(
        res,
        null,
        'Team-campaign mapping removed successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error removing team-campaign mapping');
      next(error);
    }
  }
  
  /**
   * Get all campaigns mapped to a team
   * @route GET /teams/:teamId/campaigns
   */
  async getTeamCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { isActive } = req.query;
      
      // Validate team exists
      const team = await TeamRepository.findById(teamId);
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${teamId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Get campaigns
      const campaigns = await TeamRepository.getTeamCampaigns(
        teamId,
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      );
      
      return ResponseUtil.success(
        res,
        campaigns,
        'Team campaigns retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting team campaigns');
      next(error);
    }
  }
}