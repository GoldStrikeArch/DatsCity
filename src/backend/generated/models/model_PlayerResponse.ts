/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { model_DoneTowerResponse } from "./model_DoneTowerResponse";
import type { model_PlayerTowerResponse } from "./model_PlayerTowerResponse";
export type model_PlayerResponse = {
  doneTowers?: Array<model_DoneTowerResponse>;
  score?: number;
  tower?: model_PlayerTowerResponse;
};
