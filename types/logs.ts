export type LogActorType = "user" | "admin"

export type LogActionType =
  | "user_action"
  | "user_update"
  | "user_delete"
  | "user_credits_update"
  | "user_role_update"
  | "system_config_update"
  | "activation_code_generate"
  | "activation_code_redeem"
  | "register merchant/distributor"

export interface Log {
  id: number
  uid: number
  actor_type: LogActorType
  actor_id: number
  lid: number
  log_type: string
  action_type: LogActionType
  log_content: string
  create_date: number
}