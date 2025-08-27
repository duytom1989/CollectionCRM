import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/Table';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { workflowApi, TeamInfo } from '../../../../services/api/workflow.api';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface TeamListProps {
  onEditTeam: (team: TeamInfo) => void;
  onDeleteTeam: (team: TeamInfo) => void;
  refreshTrigger: number;
}

const TeamList: React.FC<TeamListProps> = ({
  onEditTeam,
  onDeleteTeam,
  refreshTrigger
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState({
    teams: [] as TeamInfo[],
    loading: true,
    error: null as string | null,
    pagination: {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalItems: 0
    }
  });

  useEffect(() => {
    loadTeams();
  }, [refreshTrigger, state.pagination.page]);

  const loadTeams = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await workflowApi.getTeams({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize
      });
      
      setState(prev => ({
        ...prev,
        teams: response.teams,
        pagination: response.pagination,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load teams:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load teams'
      }));
    }
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  };

  const getActiveBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'danger';
  };

  const getActiveBadgeText = (isActive: boolean) => {
    return isActive ? t('common:active') : t('common:inactive');
  };

  if (state.loading && state.teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">{t('settings:messages.loading_teams', { defaultValue: 'Loading teams...' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">{t('settings:messages.error_loading_teams')}</h3>
            <p className="text-neutral-600 mb-4">{state.error}</p>
            <Button variant="primary" onClick={loadTeams}>
              {t('common:retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">{t('settings:messages.no_teams')}</h3>
            <p className="text-neutral-600 mb-4">{t('settings:messages.create_first_team')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('settings:messages.teams_list', { defaultValue: 'Teams List' })}</span>
          <Badge variant="secondary">
            {state.pagination.totalItems} {t('settings:messages.teams', { defaultValue: 'teams' })}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings:team_fields.name')}</TableHead>
                <TableHead>{t('settings:team_fields.department')}</TableHead>
                <TableHead>{t('settings:team_fields.center')}</TableHead>
                <TableHead>{t('settings:team_fields.region')}</TableHead>
                <TableHead>{t('settings:team_fields.teamlead')}</TableHead>
                <TableHead>{t('settings:team_fields.status')}</TableHead>
                <TableHead className="w-16">{t('common:actionstext')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-neutral-900">{team.name}</div>
                      {team.description && (
                        <div className="text-sm text-neutral-500">{team.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{team.department}</TableCell>
                  <TableCell>{team.center}</TableCell>
                  <TableCell>{team.region}</TableCell>
                  <TableCell>
                    {team.teamleadAgent ? (
                      <div>
                        <div className="font-medium text-neutral-900">{team.teamleadAgent.name}</div>
                        <div className="text-sm text-neutral-500">{team.teamleadAgent.employeeId || team.teamleadAgent.id}</div>
                      </div>
                    ) : (
                      <span className="text-neutral-400">{t('settings:messages.no_teamlead')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActiveBadgeVariant(team.isActive)}>
                      {getActiveBadgeText(team.isActive)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <EllipsisVerticalIcon className="w-5 h-5 text-neutral-600" />
                      </Menu.Button>
                      
                      <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onEditTeam(team)}
                                  className={`${
                                    active ? 'bg-neutral-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-neutral-700`}
                                >
                                  <PencilIcon className="w-4 h-4 mr-3" />
                                  {t('common:edit')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onDeleteTeam(team)}
                                  className={`${
                                    active ? 'bg-neutral-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                >
                                  <TrashIcon className="w-4 h-4 mr-3" />
                                  {t('common:delete')}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {state.pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-neutral-700">
              {t('settings:messages.showing_results', {
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} results',
                replace: {
                  start: (state.pagination.page - 1) * state.pagination.pageSize + 1,
                  end: Math.min(
                    state.pagination.page * state.pagination.pageSize,
                    state.pagination.totalItems
                  ),
                  total: state.pagination.totalItems
                }
              })}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(state.pagination.page - 1)}
                disabled={state.pagination.page <= 1}
              >
                {t('common:previous')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(state.pagination.page + 1)}
                disabled={state.pagination.page >= state.pagination.totalPages}
              >
                {t('common:next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamList;