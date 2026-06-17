import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const filterGroups = [
  { key: "categories", optionKey: "categories", label: "Danh mục" },
  // { key: "brands", optionKey: "brands", label: "Thương hiệu" },
  // { key: "statuses", optionKey: "statuses", label: "Trạng thái" },
  { key: "sizes", optionKey: "sizes", label: "Kích thước" },
  { key: "colors", optionKey: "colors", label: "Màu sắc" },
];

const ProductFilter = ({
  options,
  priceBounds,
  filters,
  onChange,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (filterKey, value) => {
    const currentValues = filters[filterKey];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    onChange({ ...filters, [filterKey]: nextValues });
  };

  const effectiveMinPrice = filters.minPrice ?? priceBounds.min;
  const effectiveMaxPrice = filters.maxPrice ?? priceBounds.max;

  return (
    <aside className={`product-sidebar${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="product-sidebar__toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>
          <SlidersHorizontal size={18} aria-hidden="true" />
          Bộ lọc
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      <div className="product-sidebar__content">
        <div className="product-sidebar__title">
          <div>
            <span>Tùy chỉnh kết quả</span>
            <h2>Bộ lọc</h2>
          </div>
          <SlidersHorizontal size={20} aria-hidden="true" />
        </div>

        {filterGroups.map((group) => {
          const groupOptions = options[group.optionKey];
          if (!groupOptions.length) return null;

          return (
            <fieldset className="product-filter-group" key={group.key}>
              <legend>{group.label}</legend>
              <div className="product-filter-group__options">
                {groupOptions.map((option) => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={filters[group.key].includes(option)}
                      onChange={() => toggleValue(group.key, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        {priceBounds.max > priceBounds.min && (
          <fieldset className="product-filter-group product-price-filter">
            <legend>Khoảng giá</legend>
            <label>
              <span>Giá thấp nhất</span>
              <strong>{formatCurrency(effectiveMinPrice)}</strong>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={effectiveMinPrice}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    minPrice: Math.min(
                      Number(event.target.value),
                      effectiveMaxPrice,
                    ),
                  })
                }
              />
            </label>
            <label>
              <span>Giá cao nhất</span>
              <strong>{formatCurrency(effectiveMaxPrice)}</strong>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={effectiveMaxPrice}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    maxPrice: Math.max(
                      Number(event.target.value),
                      effectiveMinPrice,
                    ),
                  })
                }
              />
            </label>
          </fieldset>
        )}

        <button
          type="button"
          className="product-sidebar__clear"
          onClick={onClear}
        >
          Xóa bộ lọc
        </button>
      </div>
    </aside>
  );
};

export default ProductFilter;
