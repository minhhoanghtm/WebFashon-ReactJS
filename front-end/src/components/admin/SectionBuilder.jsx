import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Upload, 
  Plus, 
  X, 
  Move, 
  Loader2, 
  Layout, 
  Search 
} from "lucide-react";
import { toast } from "react-toastify";
import { uploadImageService } from "../../services/upload.service";
import { suggestProductsService } from "../../services/product.service";

const sectionTypesList = [
  { value: "hero", label: "Hero Block" },
  { value: "story", label: "Rich Text Story" },
  { value: "gallery", label: "Editorial Gallery" },
  { value: "quote", label: "Fashion Quote" },
  { value: "image_text", label: "Image + Text" },
  { value: "products", label: "Product Spotlight" },
  { value: "banner", label: "Full Width Banner" },
  { value: "cta", label: "Closing CTA Section" }
];

export const SectionBuilder = ({ sections, setSections, selectedProducts, setSelectedProducts }) => {
  const [newSectionType, setNewSectionType] = useState("hero");
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [activeProductSectionIdx, setActiveProductSectionIdx] = useState(null);

  // Handle Product Suggestions Query
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!productSearch.trim()) {
        setProductSuggestions([]);
        return;
      }
      try {
        setSearchingProducts(true);
        const res = await suggestProductsService(productSearch);
        const results = Array.isArray(res) ? res : res?.data ?? [];
        setProductSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error("Lỗi khi tìm gợi ý sản phẩm:", error);
      } finally {
        setSearchingProducts(false);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [productSearch]);

  const handleAddProduct = (product) => {
    if (activeProductSectionIdx !== null) {
      const idx = activeProductSectionIdx;
      const nextSecs = [...sections];
      const productIds = nextSecs[idx].data.productIds || [];
      if (productIds.includes(product._id)) {
        toast.warning("Sản phẩm đã tồn tại trong khối này!");
        return;
      }
      nextSecs[idx].data.productIds = [...productIds, product._id];
      
      // Keep product details loaded in memory
      if (!selectedProducts.some((p) => p._id === product._id)) {
        setSelectedProducts([...selectedProducts, product]);
      }
      
      setSections(nextSecs);
      setProductSearch("");
      setProductSuggestions([]);
      setActiveProductSectionIdx(null);
      toast.success("Thêm sản phẩm thành công!");
    }
  };

  const handleRemoveProductFromSection = (secIdx, productId) => {
    const nextSecs = [...sections];
    const productIds = nextSecs[secIdx].data.productIds || [];
    nextSecs[secIdx] = {
      ...nextSecs[secIdx],
      data: {
        ...nextSecs[secIdx].data,
        productIds: productIds.filter(id => id !== productId)
      }
    };
    setSections(nextSecs);
  };

  const handleAddSection = () => {
    let defaultData = {};
    const type = newSectionType;
    if (type === "hero") {
      defaultData = { title: "", subtitle: "", description: "", coverImage: "", buttonText: "", buttonLink: "" };
    } else if (type === "story") {
      defaultData = { heading: "", content: "" };
    } else if (type === "gallery") {
      defaultData = { images: [] };
    } else if (type === "quote") {
      defaultData = { quote: "", author: "" };
    } else if (type === "image_text") {
      defaultData = { image: "", title: "", content: "", imagePosition: "left" };
    } else if (type === "products") {
      defaultData = { productIds: [] };
    } else if (type === "banner") {
      defaultData = { image: "", title: "", subtitle: "", buttonText: "", buttonLink: "" };
    } else if (type === "cta") {
      defaultData = { title: "", description: "", buttonText: "", buttonLink: "" };
    }

    setSections([...sections, { type, order: sections.length, isActive: true, data: defaultData }]);
    toast.success("Đã thêm khối nội dung mới!");
  };

  const handleRemoveSection = (idx) => {
    const nextSecs = sections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i }));
    setSections(nextSecs);
  };

  const handleMoveSection = (idx, direction) => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    const nextSecs = [...sections];
    const temp = nextSecs[idx];
    nextSecs[idx] = nextSecs[nextIdx];
    nextSecs[nextIdx] = temp;

    // Recalculate order indices
    nextSecs.forEach((s, i) => {
      s.order = i;
    });

    setSections(nextSecs);
  };

  const handleUpdateSectionData = (idx, key, value) => {
    const nextSecs = [...sections];
    nextSecs[idx] = {
      ...nextSecs[idx],
      data: {
        ...nextSecs[idx].data,
        [key]: value
      }
    };
    setSections(nextSecs);
  };

  const handleSectionImageUpload = async (e, idx, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang tải ảnh...");
      const url = await uploadImageService(file);
      handleUpdateSectionData(idx, key, url);
      toast.success("Tải ảnh thành công!");
    } catch (err) {
      console.error("Lỗi khi tải ảnh khối:", err);
      toast.error("Tải ảnh thất bại!");
    }
  };

  const handleAddGalleryImage = (idx) => {
    const nextSecs = [...sections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    nextImages.push({ imageUrl: "", caption: "" });
    nextSecs[idx] = {
      ...nextSecs[idx],
      data: {
        ...nextSecs[idx].data,
        images: nextImages
      }
    };
    setSections(nextSecs);
  };

  const handleRemoveGalleryImage = (idx, imgIdx) => {
    const nextSecs = [...sections];
    const nextImages = [...(nextSecs[idx].data.images || [])].filter((_, i) => i !== imgIdx);
    nextSecs[idx] = {
      ...nextSecs[idx],
      data: {
        ...nextSecs[idx].data,
        images: nextImages
      }
    };
    setSections(nextSecs);
  };

  const handleMoveGalleryImage = (idx, imgIdx, direction) => {
    const nextSecs = [...sections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    if (direction === "up" && imgIdx === 0) return;
    if (direction === "down" && imgIdx === nextImages.length - 1) return;

    const nextIdx = direction === "up" ? imgIdx - 1 : imgIdx + 1;
    const temp = nextImages[imgIdx];
    nextImages[imgIdx] = nextImages[nextIdx];
    nextImages[nextIdx] = temp;

    nextSecs[idx] = {
      ...nextSecs[idx],
      data: {
        ...nextSecs[idx].data,
        images: nextImages
      }
    };
    setSections(nextSecs);
  };

  const handleUpdateGalleryImageField = (idx, imgIdx, key, value) => {
    const nextSecs = [...sections];
    const nextImages = [...(nextSecs[idx].data.images || [])];
    nextImages[imgIdx] = { ...nextImages[imgIdx], [key]: value };
    nextSecs[idx] = {
      ...nextSecs[idx],
      data: {
        ...nextSecs[idx].data,
        images: nextImages
      }
    };
    setSections(nextSecs);
  };

  const handleGalleryImageUpload = async (e, idx, imgIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang tải ảnh...");
      const url = await uploadImageService(file);
      handleUpdateGalleryImageField(idx, imgIdx, "imageUrl", url);
      toast.success("Tải ảnh thành công!");
    } catch (err) {
      console.error("Lỗi khi tải ảnh gallery:", err);
      toast.error("Tải ảnh thất bại!");
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h4 className="text-sm font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="h-4.5 w-4.5" />
            Xây dựng bố cục trang Lookbook
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Thêm, bớt, chỉnh sửa và kéo thả/sắp xếp thứ tự các khối nội dung hiển thị trong bộ sưu tập.
          </p>
        </div>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-slate-50/50">
          <Move className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h5 className="text-sm font-bold text-gray-700">Chưa có khối nội dung nào</h5>
          <p className="text-xs text-gray-400 mt-1">Chọn loại khối bên dưới và nhấn Thêm để bắt đầu thiết kế.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec, idx) => {
            const typeLabel = sectionTypesList.find(t => t.value === sec.type)?.label || sec.type;

            return (
              <div 
                key={idx} 
                className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col transition hover:border-gray-300"
              >
                {/* Block Header */}
                <div className="bg-slate-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center shrink-0 select-none">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      {typeLabel}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, "up")}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Di chuyển lên"
                    >
                      <ChevronUp className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, "down")}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Di chuyển xuống"
                    >
                      <ChevronDown className="h-4.5 w-4.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer"
                      title="Xóa khối"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Block Content Inputs */}
                <div className="p-5 space-y-4">
                  {/* 1. HERO BLOCK */}
                  {sec.type === "hero" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiêu đề lớn</label>
                        <input
                          type="text"
                          value={sec.data.title || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phụ đề</label>
                        <input
                          type="text"
                          value={sec.data.subtitle || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "subtitle", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mô tả ngắn</label>
                        <textarea
                          value={sec.data.description || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "description", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhãn nút CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonText || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonText", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đường dẫn CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonLink || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonLink", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      {/* Cover Image Upload */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ảnh bìa Hero</label>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            {sec.data.coverImage ? (
                              <img src={sec.data.coverImage} alt="Hero" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400">Không ảnh</span>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Tải ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSectionImageUpload(e, idx, "coverImage")}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={sec.data.coverImage || ""}
                            onChange={(e) => handleUpdateSectionData(idx, "coverImage", e.target.value)}
                            placeholder="Hoặc điền URL ảnh..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. STORY BLOCK */}
                  {sec.type === "story" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiêu đề phụ câu chuyện</label>
                        <input
                          type="text"
                          value={sec.data.heading || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "heading", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1 text-left min-h-[180px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nội dung câu chuyện</label>
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                          <ReactQuill
                            value={sec.data.content || ""}
                            onChange={(val) => handleUpdateSectionData(idx, "content", val)}
                            theme="snow"
                            className="h-32 bg-white"
                            modules={{
                              toolbar: [
                                ["bold", "italic", "underline", "clean"],
                                [{ list: "ordered" }, { list: "bullet" }],
                                ["link", "image"],
                              ],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. GALLERY BLOCK */}
                  {sec.type === "gallery" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center select-none">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Danh sách hình ảnh bộ sưu tập</label>
                        <button
                          type="button"
                          onClick={() => handleAddGalleryImage(idx)}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          Thêm ảnh
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(sec.data.images || []).map((img, imgIdx) => (
                          <div key={imgIdx} className="flex gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-gray-100 relative">
                            <div className="w-16 h-12 border rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
                              {img.imageUrl ? (
                                <img src={img.imageUrl} alt="Gallery item" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] text-gray-400">Trống</span>
                              )}
                            </div>
                            
                            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer shrink-0">
                              <Upload className="h-3 w-3" />
                              <span>Tải</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleGalleryImageUpload(e, idx, imgIdx)}
                                className="hidden"
                              />
                            </label>

                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={img.imageUrl || ""}
                                onChange={(e) => handleUpdateGalleryImageField(idx, imgIdx, "imageUrl", e.target.value)}
                                placeholder="URL ảnh..."
                                className="w-full px-3 py-1 border border-gray-200 rounded-lg text-[10px]"
                              />
                              <input
                                type="text"
                                value={img.caption || ""}
                                onChange={(e) => handleUpdateGalleryImageField(idx, imgIdx, "caption", e.target.value)}
                                placeholder="Caption ảnh..."
                                className="w-full px-3 py-1 border border-gray-200 rounded-lg text-[10px]"
                              />
                            </div>

                            <div className="flex flex-col gap-1 select-none">
                              <button
                                type="button"
                                disabled={imgIdx === 0}
                                onClick={() => handleMoveGalleryImage(idx, imgIdx, "up")}
                                className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={imgIdx === sec.data.images.length - 1}
                                onClick={() => handleMoveGalleryImage(idx, imgIdx, "down")}
                                className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx, imgIdx)}
                              className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. QUOTE BLOCK */}
                  {sec.type === "quote" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nội dung quote</label>
                        <textarea
                          value={sec.data.quote || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "quote", e.target.value)}
                          placeholder="Sự thanh lịch..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tác giả / Thương hiệu</label>
                        <input
                          type="text"
                          value={sec.data.author || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "author", e.target.value)}
                          placeholder="Christian Dior"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. IMAGE + TEXT BLOCK */}
                  {sec.type === "image_text" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiêu đề khối</label>
                        <input
                          type="text"
                          value={sec.data.title || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vị trí ảnh</label>
                        <select
                          value={sec.data.imagePosition || "left"}
                          onChange={(e) => handleUpdateSectionData(idx, "imagePosition", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="left">Bên trái</option>
                          <option value="right">Bên phải</option>
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nội dung mô tả</label>
                        <textarea
                          value={sec.data.content || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "content", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-20 resize-none"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hình ảnh khối</label>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            {sec.data.image ? (
                              <img src={sec.data.image} alt="Text position" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400">Không ảnh</span>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Tải ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSectionImageUpload(e, idx, "image")}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={sec.data.image || ""}
                            onChange={(e) => handleUpdateSectionData(idx, "image", e.target.value)}
                            placeholder="URL ảnh..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. PRODUCT SPOTLIGHT BLOCK */}
                  {sec.type === "products" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Thêm sản phẩm vào khối</label>
                        
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={activeProductSectionIdx === idx ? productSearch : ""}
                            onChange={(e) => {
                              setActiveProductSectionIdx(idx);
                              setProductSearch(e.target.value);
                            }}
                            placeholder="Tìm kiếm sản phẩm theo tên..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs"
                          />

                          {/* Search Suggestions dropdown */}
                          {activeProductSectionIdx === idx && productSearch && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                              {searchingProducts ? (
                                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Đang tìm...</span>
                                </div>
                              ) : productSuggestions.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-400">Không tìm thấy sản phẩm nào</div>
                              ) : (
                                productSuggestions.map((prod) => (
                                  <button
                                    key={prod._id}
                                    type="button"
                                    onClick={() => handleAddProduct(prod)}
                                    className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded border bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                      {prod.thumbnail_url || prod.images?.[0] ? (
                                        <img src={prod.thumbnail_url || prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[6px] text-gray-400">Trống</span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-gray-800 line-clamp-1">{prod.name}</div>
                                      <div className="text-[10px] text-gray-400 font-mono">{prod.slug}</div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display selected products */}
                      <div className="space-y-2 select-none">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sản phẩm đã chọn</label>
                        {(sec.data.productIds || []).length === 0 ? (
                          <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 bg-slate-50/50">
                            Chưa có sản phẩm nào được chọn.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(sec.data.productIds || []).map((pid) => {
                              const details = selectedProducts.find((p) => p._id === pid);
                              return (
                                <div 
                                  key={pid} 
                                  className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] text-indigo-700 font-bold font-sans"
                                >
                                  <span>{details?.name || `Product ID: ${pid}`}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductFromSection(idx, pid)}
                                    className="p-0.5 hover:bg-indigo-200 text-indigo-600 hover:text-indigo-800 rounded transition cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 7. FULL WIDTH BANNER BLOCK */}
                  {sec.type === "banner" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiêu đề banner</label>
                        <input
                          type="text"
                          value={sec.data.title || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phụ đề banner</label>
                        <input
                          type="text"
                          value={sec.data.subtitle || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "subtitle", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhãn nút CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonText || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonText", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đường dẫn CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonLink || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonLink", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      {/* Image Upload */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ảnh Banner</label>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            {sec.data.image ? (
                              <img src={sec.data.image} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400">Không ảnh</span>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Tải ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSectionImageUpload(e, idx, "image")}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={sec.data.image || ""}
                            onChange={(e) => handleUpdateSectionData(idx, "image", e.target.value)}
                            placeholder="URL ảnh..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. CLOSING CTA BLOCK */}
                  {sec.type === "cta" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiêu đề CTA</label>
                        <input
                          type="text"
                          value={sec.data.title || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhãn nút CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonText || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonText", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đường dẫn CTA</label>
                        <input
                          type="text"
                          value={sec.data.buttonLink || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "buttonLink", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mô tả phụ</label>
                        <textarea
                          value={sec.data.description || ""}
                          onChange={(e) => handleUpdateSectionData(idx, "description", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Section Controls */}
      <div className="flex gap-3 bg-slate-50 border border-gray-200 p-4 rounded-2xl select-none items-center">
        <select
          value={newSectionType}
          onChange={(e) => setNewSectionType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-700 focus:outline-hidden cursor-pointer"
        >
          {sectionTypesList.map((st) => (
            <option key={st.value} value={st.value}>{st.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddSection}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-200 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm Khối
        </button>
      </div>
    </div>
  );
};

export default SectionBuilder;

