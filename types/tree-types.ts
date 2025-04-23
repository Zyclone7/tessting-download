import { TreeNodeDatum } from "react-d3-tree";

export interface User {
  ID: number;
  display_name: string;
  user_activation_key: string;
  user_credits: number;
  user_email: string;
  user_level: number;
  user_login: string;
  user_nicename: string;
  user_pass: string;
  user_referral_code: string;
  user_referred_by_id: number | null;
  user_registered: string;
  user_role: string;
  user_status: number;
  user_upline_id: number | null;
  user_url: string;
}

export interface CustomTreeNodeDatum extends TreeNodeDatum {
  id: number;
  name: string;
  role: string;
  level: number;
  uplineId: number | null;
  children?: CustomTreeNodeDatum[];
  user: User;
  x?: number;
  y?: number;
}

export interface LinkData {
  source: {
    x: number;
    y: number;
  };
  target: {
    x: number;
    y: number;
  };
}

