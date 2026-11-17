export interface AdminIngredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  minThreshold: number;
  systemManaged: boolean;
  unitEditable: boolean;
  deletable: boolean;
}

export interface SaveAdminIngredient {
  name: string;
  unit: string;
  minThreshold: number;
}
