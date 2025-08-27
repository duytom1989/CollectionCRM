import { Team } from '../entities/team.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for teams
 */
export interface TeamSearchCriteria {
  department?: string;
  center?: string;
  region?: string;
  isActive?: boolean;
  teamleadAgentId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Team entity
 */
export const TeamRepository = AppDataSource.getRepository(Team).extend({
  /**
   * Find a team by ID
   * @param id Team ID
   * @returns The team if found, undefined otherwise
   */
  async findById(id: string): Promise<Team | null> {
    try {
      return await this.findOne({
        where: { id },
        relations: ['teamleadAgent']
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'findById' }
      );
    }
  },

  /**
   * Find a team by name
   * @param name Team name
   * @returns The team if found, undefined otherwise
   */
  async findByName(name: string): Promise<Team | null> {
    try {
      return await this.findOne({
        where: { name },
        relations: ['teamleadAgent']
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { name, operation: 'findByName' }
      );
    }
  },

  /**
   * Find teams by team lead agent ID
   * @param teamleadAgentId Team lead agent ID
   * @returns Array of teams led by the agent
   */
  async findByTeamleadAgentId(teamleadAgentId: string): Promise<Team[]> {
    try {
      return await this.find({
        where: { teamleadAgentId },
        relations: ['teamleadAgent']
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { teamleadAgentId, operation: 'findByTeamleadAgentId' }
      );
    }
  },

  /**
   * Search teams based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of teams
   */
  async searchTeams(criteria: TeamSearchCriteria): Promise<PaginatedResponse<Team>> {
    try {
      const queryBuilder = this.createQueryBuilder('team')
        .leftJoinAndSelect('team.teamleadAgent', 'teamleadAgent');
      
      // Apply filters
      if (criteria.department) {
        queryBuilder.andWhere('team.department = :department', { department: criteria.department });
      }
      
      if (criteria.center) {
        queryBuilder.andWhere('team.center = :center', { center: criteria.center });
      }
      
      if (criteria.region) {
        queryBuilder.andWhere('team.region = :region', { region: criteria.region });
      }
      
      if (criteria.isActive !== undefined) {
        queryBuilder.andWhere('team.is_active = :isActive', { isActive: criteria.isActive });
      }
      
      if (criteria.teamleadAgentId) {
        queryBuilder.andWhere('team.teamlead_agent_id = :teamleadAgentId', { teamleadAgentId: criteria.teamleadAgentId });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('team.name', 'ASC');
      
      // Get paginated results
      const teams = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(teams, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchTeams' }
      );
    }
  },

  /**
   * Create a new team
   * @param team Team data
   * @returns The created team
   */
  async createTeam(team: Partial<Team>): Promise<Team> {
    try {
      const newTeam = this.create(team);
      return await this.save(newTeam);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { team, operation: 'createTeam' }
      );
    }
  },

  /**
   * Update an existing team
   * @param id Team ID
   * @param teamData Updated team data
   * @returns The updated team
   */
  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team> {
    try {
      const team = await this.findById(id);
      
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Update team properties
      Object.assign(team, teamData);
      
      return await this.save(team);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, teamData, operation: 'updateTeam' }
      );
    }
  },

  /**
   * Delete a team (soft delete by setting is_active to false)
   * @param id Team ID
   * @returns The updated team
   */
  async deleteTeam(id: string): Promise<Team> {
    try {
      const team = await this.findById(id);
      
      if (!team) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Team with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Soft delete by setting is_active to false
      team.isActive = false;
      
      return await this.save(team);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'deleteTeam' }
      );
    }
  }
});