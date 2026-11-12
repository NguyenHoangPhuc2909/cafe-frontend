export interface EmployeeResponse {
  id: number;
  username: string;
  fullName?: string | null;
  email: string;
  role: "STAFF";
  createdAt?: string | null;
  isActive: boolean;
}

export interface CreateEmployeeRequest {
  username: string;
  password: string;
  email: string;
  fullName?: string;
}

export interface UpdateEmployeeRequest {
  fullName: string | null;
  email: string;
}

export type CreateEmployeeResponse = Omit<EmployeeResponse, "createdAt" | "isActive">;