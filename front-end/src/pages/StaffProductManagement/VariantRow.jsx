import React from "react";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const VariantRow = ({ variant, index, onChange, onRemove }) => {
  const handleField = (field, value) => {
    onChange(index, { ...variant, [field]: value });
  };

  const handleVariantImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const url = await readFileAsDataUrl(file);
    onChange(index, { ...variant, image_url: url });
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-700">Mẫu #{index + 1}</span>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Xóa
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="">Tên mẫu</label>
          <input
            value={variant.color}
            onChange={(e) => handleField("color", e.target.value)}
            placeholder="Màu"
            className="border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="">Size</label>
          <input
            value={variant.size}
            onChange={(e) => handleField("size", e.target.value)}
            placeholder="Size"
            className="border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="stock">Số lượng</label>
          <input
            type="number"
            value={variant.stock}
            onChange={(e) => handleField("stock", e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {variant.image_url && (
          <img
            src={variant.image_url}
            className="w-14 h-14 rounded-lg object-cover border"
          />
        )}

        <input type="file" onChange={handleVariantImage} />

        {variant.image_url && (
          <button
            onClick={() => onChange(index, { ...variant, image_url: "" })}
            className="text-red-500 text-sm"
          >
            Xóa ảnh
          </button>
        )}
      </div>
    </div>
  );
};

export default VariantRow;
