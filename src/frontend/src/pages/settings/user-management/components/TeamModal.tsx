import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert, Textarea } from '../../../../components/ui';
import { workflowApi, TeamInfo, CreateTeamRequest, UpdateTeamRequest, AgentInfo } from '../../../../services/api/workflow.api';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team?: TeamInfo | null;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  teamleadAgentId: string;
  department: string;
  center: string;
  region: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  teamleadAgentId?: string;
  department?: string;
  center?: string;
  region?: string;
  general?: string;
}

interface TeamModalState {
  formData: FormData;
  errors: FormErrors;
  loading: boolean;
  agents: AgentInfo[];
  loadingAgents: boolean;
}

const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  team,
  mode
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<TeamModalState>({
    formData: {
      name: '',
      description: '',
      teamleadAgentId: '',
      department: '',
      center: '',
      region: '',
      isActive: true
    },
    errors: {},
    loading: false,
    agents: [],
    loadingAgents: false
  });

  // Load agents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  // Initialize form data when team or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && team) {
        setState(prev => ({
          ...prev,
          formData: {
            name: team.name,
            description: team.description || '',
            teamleadAgentId: team.teamleadAgentId,
            department: team.department,
            center: team.center,
            region: team.region,
            isActive: team.isActive
          },
          errors: {}
        }));
      } else {
        // Reset form for create mode
        setState(prev => ({
          ...prev,
          formData: {
            name: '',
            description: '',
            teamleadAgentId: '',
            department: '',
            center: '',
            region: '',
            isActive: true
          },
          errors: {}
        }));
      }
    }
  }, [isOpen, mode, team]);

  // Load available agents
  const loadAgents = async () => {
    setState(prev => ({ ...prev, loadingAgents: true }));
    
    try {
      const response = await workflowApi.getAgents({ isActive: true, pageSize: 1000 });
      setState(prev => ({
        ...prev,
        agents: response.agents,
        loadingAgents: false
      }));
    } catch (error) {
      console.error('Failed to load agents:', error);
      setState(prev => ({
        ...prev,
        loadingAgents: false,
        errors: { general: 'Failed to load agents' }
      }));
    }
  };

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return t('forms:validation.required');
    }
    if (name.length < 2) {
      return t('forms:validation.min_length', { replace: { min: '2' } });
    }
    return undefined;
  };

  const validateTeamleadAgent = (teamleadAgentId: string): string | undefined => {
    if (!teamleadAgentId.trim()) {
      return t('forms:validation.required');
    }
    const validAgents = state.agents.map(a => a.id);
    if (!validAgents.includes(teamleadAgentId)) {
      return t('settings:validation.select_valid_agent', { defaultValue: 'Please select a valid team lead' });
    }
    return undefined;
  };

  const validateDepartment = (department: string): string | undefined => {
    if (!department.trim()) {
      return t('forms:validation.required');
    }
    return undefined;
  };

  const validateCenter = (center: string): string | undefined => {
    if (!center.trim()) {
      return t('forms:validation.required');
    }
    return undefined;
  };

  const validateRegion = (region: string): string | undefined => {
    if (!region.trim()) {
      return t('forms:validation.required');
    }
    return undefined;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.name = validateName(state.formData.name);
    newErrors.teamleadAgentId = validateTeamleadAgent(state.formData.teamleadAgentId);
    newErrors.department = validateDepartment(state.formData.department);
    newErrors.center = validateCenter(state.formData.center);
    newErrors.region = validateRegion(state.formData.region);

    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: undefined, general: undefined }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      if (mode === 'create') {
        const teamData: CreateTeamRequest = {
          name: state.formData.name.trim(),
          description: state.formData.description.trim() || undefined,
          teamleadAgentId: state.formData.teamleadAgentId,
          department: state.formData.department.trim(),
          center: state.formData.center.trim(),
          region: state.formData.region.trim()
        };

        await workflowApi.createTeam(teamData);
      } else if (mode === 'edit' && team) {
        const teamData: UpdateTeamRequest = {
          name: state.formData.name.trim(),
          description: state.formData.description.trim() || undefined,
          teamleadAgentId: state.formData.teamleadAgentId,
          department: state.formData.department.trim(),
          center: state.formData.center.trim(),
          region: state.formData.region.trim(),
          isActive: state.formData.isActive
        };

        await workflowApi.updateTeam(team.id, teamData);
      }

      // Reset loading state before calling onSuccess
      setState(prev => ({ ...prev, loading: false }));
      onSuccess();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: {
          general: error instanceof Error ? error.message : `Failed to ${mode} team`
        }
      }));
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!state.loading) {
      setState(prev => ({
        ...prev,
        formData: {
          name: '',
          description: '',
          teamleadAgentId: '',
          department: '',
          center: '',
          region: '',
          isActive: true
        },
        errors: {}
      }));
      onClose();
    }
  };

  const agentOptions = state.agents.map(agent => ({
    value: agent.id,
    label: `${agent.name} (${agent.employeeId || agent.id})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? t('settings:user_management.add_team') : t('settings:user_management.edit_team')}
      description={mode === 'create'
        ? t('settings:messages.add_team_description', { defaultValue: 'Add a new team with team lead and organizational structure' })
        : t('settings:messages.edit_team_description', { defaultValue: 'Update team information and team lead assignment' })
      }
      size="md"
      closeOnOverlayClick={!state.loading}
      closeOnEsc={!state.loading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {state.errors.general && (
          <Alert variant="danger">
            {state.errors.general}
          </Alert>
        )}

        {/* Name Field */}
        <div>
          <Input
            label={t('settings:team_fields.name')}
            type="text"
            value={state.formData.name}
            onChange={handleInputChange('name')}
            error={state.errors.name}
            disabled={state.loading}
            placeholder={t('settings:placeholders.team_name')}
            required
            aria-describedby={state.errors.name ? 'name-error' : undefined}
          />
        </div>

        {/* Description Field */}
        <div>
          <Textarea
            label={t('settings:team_fields.description')}
            value={state.formData.description}
            onChange={handleInputChange('description')}
            error={state.errors.description}
            disabled={state.loading}
            placeholder={t('settings:placeholders.team_description')}
            rows={3}
            aria-describedby={state.errors.description ? 'description-error' : undefined}
          />
        </div>

        {/* Team Lead Field */}
        <div>
          <Select
            label={t('settings:team_fields.teamlead')}
            value={state.formData.teamleadAgentId}
            onChange={handleInputChange('teamleadAgentId')}
            options={[
              { value: '', label: t('settings:messages.select_teamlead', { defaultValue: 'Select a team lead...' }) },
              ...agentOptions
            ]}
            error={state.errors.teamleadAgentId}
            disabled={state.loading || state.loadingAgents}
            required
            aria-describedby={state.errors.teamleadAgentId ? 'teamlead-error' : undefined}
          />
          {state.loadingAgents && (
            <p className="mt-1 text-xs text-neutral-500">{t('settings:messages.loading_agents', { defaultValue: 'Loading agents...' })}</p>
          )}
        </div>

        {/* Department Field */}
        <div>
          <Input
            label={t('settings:team_fields.department')}
            type="text"
            value={state.formData.department}
            onChange={handleInputChange('department')}
            error={state.errors.department}
            disabled={state.loading}
            placeholder={t('settings:placeholders.department')}
            required
            aria-describedby={state.errors.department ? 'department-error' : undefined}
          />
        </div>

        {/* Center Field */}
        <div>
          <Input
            label={t('settings:team_fields.center')}
            type="text"
            value={state.formData.center}
            onChange={handleInputChange('center')}
            error={state.errors.center}
            disabled={state.loading}
            placeholder={t('settings:placeholders.center')}
            required
            aria-describedby={state.errors.center ? 'center-error' : undefined}
          />
        </div>

        {/* Region Field */}
        <div>
          <Input
            label={t('settings:team_fields.region')}
            type="text"
            value={state.formData.region}
            onChange={handleInputChange('region')}
            error={state.errors.region}
            disabled={state.loading}
            placeholder={t('settings:placeholders.region')}
            required
            aria-describedby={state.errors.region ? 'region-error' : undefined}
          />
        </div>

        {/* Active Status (Edit mode only) */}
        {mode === 'edit' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={state.formData.isActive}
              onChange={handleInputChange('isActive')}
              disabled={state.loading}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-neutral-900">
              {t('settings:team_fields.is_active')}
            </label>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={state.loading}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={state.loading}
            disabled={state.loadingAgents}
          >
            {mode === 'create' ? t('settings:user_management.add_team') : t('settings:user_management.edit_team')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TeamModal;