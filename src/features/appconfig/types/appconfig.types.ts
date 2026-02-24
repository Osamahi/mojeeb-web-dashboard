/** Frontend type (camelCase) */
export interface AppConfigItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** API response type (snake_case from Newtonsoft.Json) */
export interface ApiAppConfigItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppConfigDto {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateAppConfigDto {
  value?: string;
  description?: string;
}
