import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { game_RoundListResponse } from "../models/game_RoundListResponse";
import type { model_PlayerBuildRequest } from "../models/model_PlayerBuildRequest";
import type { model_PlayerExtendedWordsResponse } from "../models/model_PlayerExtendedWordsResponse";
import type { model_PlayerResponse } from "../models/model_PlayerResponse";
import type { model_PlayerWordsResponse } from "../models/model_PlayerWordsResponse";
export class PlayerService {
  /**
   * Words list
   * @returns model_PlayerExtendedWordsResponse OK
   * @throws ApiError
   */
  public static getApiWords(): CancelablePromise<model_PlayerExtendedWordsResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/words",
      errors: {
        400: `Bad Request`,
      },
    });
  }
  /**
   * Build tower or add words to existing tower. If tower is done, it will be saved and you can start new tower
   * @param requestBody words, positions and directions
   * @returns model_PlayerWordsResponse OK
   * @throws ApiError
   */
  public static postApiBuild(requestBody: model_PlayerBuildRequest): CancelablePromise<model_PlayerWordsResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/build",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad Request`,
      },
    });
  }
  /**
   * Shuffle words list
   * @returns model_PlayerWordsResponse OK
   * @throws ApiError
   */
  public static postApiShuffle(): CancelablePromise<model_PlayerWordsResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/shuffle",
      errors: {
        400: `Bad Request`,
      },
    });
  }
  /**
   * All  towers
   * @returns model_PlayerResponse OK
   * @throws ApiError
   */
  public static getApiTowers(): CancelablePromise<model_PlayerResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/towers",
      errors: {
        400: `Bad Request`,
      },
    });
  }
  /**
   * game rounds
   * @returns game_RoundListResponse OK
   * @throws ApiError
   */
  public static getApiRounds(): CancelablePromise<game_RoundListResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/rounds",
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }
}
