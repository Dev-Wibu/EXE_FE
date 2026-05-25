import type { ApiResponse, Round, SetupJdRoundsRequest, UpdateJdRoundRequest } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

export class RoundManager {
  private api = createApiInstance();

  async setUpForJd(
    jdId: number | string,
    data: SetupJdRoundsRequest
  ): Promise<ApiResponse<Round[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.ROUNDS.SETUP_JD, { jdId });
      const response = await this.api.put<Round[]>(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the thiet lap vong phong van",
      };
    }
  }

  async updateForJd(
    jdId: number | string,
    data: UpdateJdRoundRequest
  ): Promise<ApiResponse<Round[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.ROUNDS.UPDATE_JD, { jdId });
      const response = await this.api.put<Round[]>(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the cap nhat vong phong van",
      };
    }
  }
}

export const roundManager = new RoundManager();
