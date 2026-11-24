export interface AdminTable {
  id: number;
  name: string;
  qrCode: string;
  isActive: boolean;
  hasOpenSession: boolean;
  openSessionId: number | null;
  hasSessionHistory: boolean;
  canDeactivate: boolean;
  deletable: boolean;
}

export interface SaveAdminTable {
  name: string;
}
