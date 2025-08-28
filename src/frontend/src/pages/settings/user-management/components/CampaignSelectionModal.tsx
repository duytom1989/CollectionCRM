import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Spinner } from '../../../../components/ui/Spinner';
import { campaignsApi, Campaign } from '../../../../services/api/campaign';
import { teamsApi } from '../../../../services/api/workflow';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface CampaignSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
  };
  onAssignCampaigns: (campaignIds: string[]) => Promise<void>;
}

const CampaignSelectionModal: React.FC<CampaignSelectionModalProps> = ({
  isOpen,
  onClose,
  team,
  onAssignCampaigns
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<{
    campaigns: Campaign[];
    loading: boolean;
    error: string | null;
    selectedCampaignIds: string[];
    isUpdating: boolean;
  }>({
    campaigns: [],
    loading: true,
    error: null,
    selectedCampaignIds: [],
    isUpdating: false
  });

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get all campaigns
      const response = await campaignsApi.getCampaigns();
      
      // Get campaigns that are already mapped to this team
      const teamCampaignsResponse = await teamsApi.getTeamCampaigns(team.id, true);
      
      setState(prev => ({
        ...prev,
        campaigns: response,
        loading: false,
        selectedCampaignIds: teamCampaignsResponse.map(campaign => campaign.campaign_id)
      }));
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load campaigns'
      }));
    }
  };

  const handleCampaignSelect = (campaignId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedCampaignIds: checked
        ? [...prev.selectedCampaignIds, campaignId]
        : prev.selectedCampaignIds.filter(id => id !== campaignId)
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedCampaignIds: checked
        ? prev.campaigns.map(campaign => campaign.id)
        : []
    }));
  };

  const handleAssignCampaigns = async () => {
    if (state.selectedCampaignIds.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      await onAssignCampaigns(state.selectedCampaignIds);
      onClose();
    } catch (error) {
      console.error('Failed to assign campaigns to team:', error);
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to assign campaigns to team'
      }));
    }
  };

  const isAllSelected = state.campaigns.length > 0 && state.selectedCampaignIds.length === state.campaigns.length;
  const isPartiallySelected = state.selectedCampaignIds.length > 0 && state.selectedCampaignIds.length < state.campaigns.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('settings:messages.assign_campaigns_to_team', {
        defaultValue: 'Assign Campaigns to Team'
      })}: ${team.name}`}
      description={t('settings:messages.select_campaigns_description', {
        defaultValue: 'Select campaigns to assign to this team'
      })}
      size="lg"
    >
      <div className="space-y-4">
        {state.loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6 text-primary-600" />
            <span className="ml-2 text-neutral-600">
              {t('settings:messages.loading_campaigns', { defaultValue: 'Loading campaigns...' })}
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
                  {t('settings:messages.error_loading_campaigns')}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadCampaigns}
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
            {state.campaigns.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-neutral-900">
                  {t('settings:messages.no_campaigns')}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t('settings:messages.no_campaigns_description')}
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
                      {t('settings:messages.select_all_campaigns')}
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {state.selectedCampaignIds.length} {t('settings:messages.of', { defaultValue: 'of' })} {state.campaigns.length} {t('settings:messages.selected', { defaultValue: 'selected' })}
                  </Badge>
                </div>

                <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200 max-h-96 overflow-y-auto">
                  {state.campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                          checked={state.selectedCampaignIds.includes(campaign.id)}
                          onChange={(e) => handleCampaignSelect(campaign.id, e.target.checked)}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{campaign.name}</p>
                              <p className="text-sm text-neutral-500">
                                {campaign.campaign_group?.name || 'No Group'} • Priority: {campaign.priority}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="primary" className="text-xs">
                                Priority {campaign.priority}
                              </Badge>
                              {campaign.campaign_group && (
                                <Badge variant="secondary" className="text-xs">
                                  {campaign.campaign_group.name}
                                </Badge>
                              )}
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
          onClick={handleAssignCampaigns}
          disabled={state.selectedCampaignIds.length === 0 || state.isUpdating}
          loading={state.isUpdating}
        >
          {t('settings:messages.assign_selected_campaigns', { 
            defaultValue: 'Assign Selected Campaigns',
            count: state.selectedCampaignIds.length 
          })}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CampaignSelectionModal;