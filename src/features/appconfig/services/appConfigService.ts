import api from '@/lib/api';
import type {
  AppConfigItem,
  ApiAppConfigItem,
  CreateAppConfigDto,
  UpdateAppConfigDto,
} from '../types/appconfig.types';

function transformItem(apiItem: ApiAppConfigItem): AppConfigItem {
  return {
    id: apiItem.id,
    key: apiItem.key,
    value: apiItem.value,
    description: apiItem.description,
    createdAt: apiItem.created_at,
    updatedAt: apiItem.updated_at,
  };
}

class AppConfigService {
  async getAll(): Promise<AppConfigItem[]> {
    const { data: response } = await api.get<{ data: ApiAppConfigItem[] }>(
      '/api/appConfiguration'
    );
    return response.data.map(transformItem);
  }

  async create(data: CreateAppConfigDto): Promise<AppConfigItem> {
    const { data: response } = await api.post<{ data: ApiAppConfigItem }>(
      '/api/appConfiguration',
      data
    );
    return transformItem(response.data);
  }

  async update(id: string, data: UpdateAppConfigDto): Promise<AppConfigItem> {
    const { data: response } = await api.put<{ data: ApiAppConfigItem }>(
      `/api/appConfiguration/${id}`,
      data
    );
    return transformItem(response.data);
  }
}

export const appConfigService = new AppConfigService();
