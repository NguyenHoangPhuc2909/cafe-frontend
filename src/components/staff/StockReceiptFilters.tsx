import { useState, type FormEvent } from "react";
import { Alert, Button } from "antd";
import type {
  Ingredient,
  PackagedStock,
} from "../../services/staffInventory";
import type { StockReceiptHistoryFilters } from "../../types/inventory";

interface Props {
  ingredients: Ingredient[];
  packaged: PackagedStock[];
  onApply: (filters: StockReceiptHistoryFilters) => void;
}

export default function StockReceiptFilters({
  ingredients,
  packaged,
  onApply,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const fromDate = String(form.get("fromDate") || "");
    const toDate = String(form.get("toDate") || "");
    const item = String(form.get("item") || "");

    if (fromDate && toDate && fromDate > toDate) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    const filters: StockReceiptHistoryFilters = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };

    if (item) {
      const [type, id] = item.split(":");

      if (type === "ingredient") {
        filters.ingredientId = Number(id);
      } else if (type === "product") {
        filters.productId = Number(id);
      }
    }

    setError(null);
    onApply(filters);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onReset={() => {
        setError(null);
        onApply({});
      }}
      className="mb-4 space-y-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Từ ngày
          <input
            type="date"
            name="fromDate"
            className="min-h-control rounded-lg border border-outline-variant px-3"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Đến ngày
          <input
            type="date"
            name="toDate"
            className="min-h-control rounded-lg border border-outline-variant px-3"
          />
        </label>

        <label className="flex min-w-48 flex-col gap-1 text-sm">
          Mặt hàng
          <select
            name="item"
            defaultValue=""
            className="min-h-control rounded-lg border border-outline-variant px-3"
          >
            <option value="">Tất cả mặt hàng</option>

            <optgroup label="Nguyên liệu">
              {ingredients.map((item) => (
                <option key={item.id} value={`ingredient:${item.id}`}>
                  {item.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Hàng đóng gói">
              {packaged.map((item) => (
                <option key={item.id} value={`product:${item.id}`}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <Button type="primary" htmlType="submit">
          Lọc
        </Button>

        <Button htmlType="reset">
          Xóa lọc
        </Button>
      </div>

      {error && <Alert type="error" showIcon title={error} />}
    </form>
  );
}