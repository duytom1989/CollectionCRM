import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const teamController = new TeamController();

/**
 * @route GET /teams
 * @desc Get all teams with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  teamController.getTeams
);

/**
 * @route GET /teams/:id
 * @desc Get team by ID
 * @access Private - Requires authentication
 */
router.get(
  '/:id',
  requireAuth,
  teamController.getTeamById
);

/**
 * @route POST /teams
 * @desc Create a new team
 * @access Private - Requires authentication and admin role
 */
router.post(
  '/',
  requireAuth,
  requirePermissions(['user_management:user']),
  teamController.createTeam
);

/**
 * @route PUT /teams/:id
 * @desc Update an existing team
 * @access Private - Requires authentication and admin role
 */
router.put(
  '/:id',
  requireAuth,
  requirePermissions(['user_management:user']),
  teamController.updateTeam
);

/**
 * @route DELETE /teams/:id
 * @desc Delete a team (soft delete)
 * @access Private - Requires authentication and admin role
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermissions(['user_management:user']),
  teamController.deleteTeam
);

/**
 * @route GET /teams/by-teamlead/:teamleadAgentId
 * @desc Get teams by team lead agent ID
 * @access Private - Requires authentication
 */
router.get(
  '/by-teamlead/:teamleadAgentId',
  requireAuth,
  teamController.getTeamsByTeamlead
);

export default router;