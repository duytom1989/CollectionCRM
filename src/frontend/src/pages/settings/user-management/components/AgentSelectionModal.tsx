import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Spinner } from '../../../../components/ui/Spinner';
import { agentsApi, AgentInfo } from '../../../../services/api/workflow';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
  };
  onAddAgents: (agentIds: string[]) => Promise<void>;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  isOpen,
  onClose,
  team,
  onAddAgents
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<{
    agents: AgentInfo[];
    loading: boolean;
    error: string | null;
    selectedAgentIds: string[];
    isUpdating: boolean;
  }>({
    agents: [],
    loading: true,
    error: null,
    selectedAgentIds: [],
    isUpdating: false
  });

  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get all active agents
      const response = await agentsApi.getAgents({
        isActive: true,
        pageSize: 1000 // Get all agents
      });
      
      // Get agents that are already in this team using team name
      const teamAgentsResponse = await agentsApi.getAgents({
        team: team.name,
        isActive: true,
        pageSize: 1000
      });
      
      setState(prev => ({
        ...prev,
        agents: response.agents,
        loading: false,
        selectedAgentIds: teamAgentsResponse.agents.map(agent => agent.id)
      }));
    } catch (error) {
      console.error('Failed to load agents:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load agents'
      }));
    }
  };

  const handleAgentSelect = (agentId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedAgentIds: checked
        ? [...prev.selectedAgentIds, agentId]
        : prev.selectedAgentIds.filter(id => id !== agentId)
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedAgentIds: checked
        ? prev.agents.map(agent => agent.id)
        : []
    }));
  };

  const handleAddAgents = async () => {
    if (state.selectedAgentIds.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      await onAddAgents(state.selectedAgentIds);
      onClose();
    } catch (error) {
      console.error('Failed to add agents to team:', error);
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to add agents to team'
      }));
    }
  };

  const isAllSelected = state.agents.length > 0 && state.selectedAgentIds.length === state.agents.length;
  const isPartiallySelected = state.selectedAgentIds.length > 0 && state.selectedAgentIds.length < state.agents.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('settings:messages.add_agents_to_team', {
        defaultValue: 'Add Agents to Team'
      })}: ${team.name}`}
      description={t('settings:messages.select_agents_description', {
        defaultValue: 'Select agents to add to this team'
      })}
      size="lg"
    >
      <div className="space-y-4">
        {state.loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6 text-primary-600" />
            <span className="ml-2 text-neutral-600">
              {t('settings:messages.loading_agents', { defaultValue: 'Loading agents...' })}
            </span>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t('settings:messages.error_loading_agents')}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadAgents}
                  >
                    {t('common:retry')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!state.loading && !state.error && (
          <>
            {state.agents.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-neutral-900">
                  {t('settings:messages.no_agents')}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t('settings:messages.no_agents_description')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isPartiallySelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <label className="ml-2 text-sm font-medium text-neutral-700">
                      {t('settings:messages.select_all_agents')}
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {state.selectedAgentIds.length} {t('settings:messages.of', { defaultValue: 'of' })} {state.agents.length} {t('settings:messages.selected', { defaultValue: 'selected' })}
                  </Badge>
                </div>

                <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200 max-h-96 overflow-y-auto">
                  {state.agents.map((agent) => (
                    <div key={agent.id} className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                          checked={state.selectedAgentIds.includes(agent.id)}
                          onChange={(e) => handleAgentSelect(agent.id, e.target.checked)}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{agent.name}</p>
                              <p className="text-sm text-neutral-500">{agent.email}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {agent.employeeId && (
                                <Badge variant="primary" className="text-xs">
                                  {agent.employeeId}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {agent.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={state.isUpdating}
        >
          {t('common:cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleAddAgents}
          disabled={state.selectedAgentIds.length === 0 || state.isUpdating}
          loading={state.isUpdating}
        >
          {t('settings:messages.add_selected_agents', { 
            defaultValue: 'Add Selected Agents',
            count: state.selectedAgentIds.length 
          })}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AgentSelectionModal;