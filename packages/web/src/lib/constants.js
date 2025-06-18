export const ITEM_TYPES = {
  ORGANIZATION: 'organization',
  COMPANY: 'company',
  TEAM: 'team',
  PROJECT: 'project'
};

export const API_ENDPOINTS = {
  [ITEM_TYPES.ORGANIZATION]: '/api/v1/organizations',
  [ITEM_TYPES.COMPANY]: '/api/v1/companies',
  [ITEM_TYPES.TEAM]: '/api/v1/teams',
  [ITEM_TYPES.PROJECT]: '/api/v1/projects'
}; 