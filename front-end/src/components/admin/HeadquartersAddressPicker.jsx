import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "@/services/location.service";
import { findFallbackProvince, vietnamAddressData } from "@/pages/Checkout/VietnamAddressData";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const removeAdminPrefix = (name = "") =>
  name.replace(/^(Thành phố|Tỉnh)\s+/i, "").replace(/\s+/g, " ").trim();

const normalizeSearch = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/^(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normProvince = (p) => ({
  code: String(p.ProvinceID || p.code || ""),
  name: p.ProvinceName || p.name || "",
  displayName: removeAdminPrefix(p.ProvinceName || p.name || ""),
});

const normDistrict = (d) => ({
  code: String(d.DistrictID || d.code || ""),
  name: d.DistrictName || d.name || "",
});

const normWard = (w) => ({
  code: String(w.WardCode || w.code || ""),
  name: w.WardName || w.name || "",
});

const parseAddress = (address = "") => {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return null;
  return {
    street: parts.slice(0, -3).join(", "),
    wardName: parts.at(-3),
    districtName: parts.at(-2),
    provinceName: parts.at(-1),
  };
};

const findByName = (items, targetName, getName = (i) => i.name) => {
  const norm = normalizeSearch(targetName);
  return items.find((item) => {
    return (
      normalizeSearch(getName(item)) === norm ||
      normalizeSearch(item.displayName || "") === norm
    );
  });
};

const buildAddress = ({ street, ward, district, province }) => {
  if (!street?.trim() || !ward || !district || !province) return "";
  return [street.trim(), ward.name, district.name, province.displayName || province.name].join(", ");
};

// ─── Shared select class ───────────────────────────────────────────────────────

const SELECT_CLS =
  "w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed";

const INPUT_CLS =
  "w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500";

const LABEL_CLS = "text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider";

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * HeadquartersAddressPicker
 *
 * Props:
 *  - value: string  — current full address string stored in settings.general.address
 *  - onChange: (fullAddress: string) => void  — called whenever address changes
 */
const HeadquartersAddressPicker = ({ value = "", onChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [street, setStreet] = useState("");

  const [legacyAddress, setLegacyAddress] = useState(value);
  const [hasEdited, setHasEdited] = useState(false);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);

  const hydratedRef = useRef(false);
  // Stable ref for onChange — avoids including the inline arrow fn in effect deps
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedProvince = useMemo(
    () => provinces.find((p) => p.code === provinceCode),
    [provinceCode, provinces]
  );
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.code === districtCode),
    [districtCode, districts]
  );
  const selectedWard = useMemo(
    () => wards.find((w) => w.code === wardCode),
    [wardCode, wards]
  );

  const fullAddress = useMemo(
    () => buildAddress({ street, ward: selectedWard, district: selectedDistrict, province: selectedProvince }),
    [street, selectedWard, selectedDistrict, selectedProvince]
  );

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadDistricts = useCallback(async (provCode) => {
    if (!provCode) return [];
    setLoadingDistrict(true);
    try {
      const data = await getDistrictsService(provCode);
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const mapped = arr.map(normDistrict);
      if (mapped.length > 0) return mapped;
    } catch (e) {
      console.error("Lỗi tải quận/huyện:", e);
    } finally {
      setLoadingDistrict(false);
    }
    return (findFallbackProvince(provCode)?.districts || []).map(normDistrict);
  }, []);

  const loadWards = useCallback(async (distCode, provCode = provinceCode) => {
    if (!distCode) return [];
    setLoadingWard(true);
    try {
      const data = await getWardsService(distCode);
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const mapped = arr.map(normWard);
      if (mapped.length > 0) return mapped;
    } catch (e) {
      console.error("Lỗi tải phường/xã:", e);
    } finally {
      setLoadingWard(false);
    }
    const fbProv = findFallbackProvince(provCode);
    const fbDist = fbProv?.districts.find((d) => d.code === String(distCode));
    return (fbDist?.wards || []).map(normWard);
  }, [provinceCode]);

  // ── Load provinces once ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingProvince(true);
      try {
        const api = await getProvincesService();
        const mapped = Array.isArray(api) ? api.map(normProvince) : [];
        setProvinces(mapped.length > 0 ? mapped : vietnamAddressData.map(normProvince));
      } catch {
        setProvinces(vietnamAddressData.map(normProvince));
      } finally {
        setLoadingProvince(false);
      }
    };
    load();
  }, []);

  // ── Hydrate from existing address ─────────────────────────────────────────
  useEffect(() => {
    if (!value || hydratedRef.current || provinces.length === 0) return;
    hydratedRef.current = true;

    const hydrate = async () => {
      const parsed = parseAddress(value);
      if (!parsed) { setLegacyAddress(value); return; }

      const prov = findByName(provinces, parsed.provinceName, (p) => p.displayName || p.name);
      if (!prov) { setLegacyAddress(value); return; }

      const dists = await loadDistricts(prov.code);
      const dist = findByName(dists, parsed.districtName);
      if (!dist) { setLegacyAddress(value); return; }

      const ws = await loadWards(dist.code, prov.code);
      const ward = findByName(ws, parsed.wardName);
      if (!ward) { setLegacyAddress(value); return; }

      setProvinceCode(prov.code);
      setDistricts(dists);
      setDistrictCode(dist.code);
      setWards(ws);
      setWardCode(ward.code);
      setStreet(parsed.street);
      setLegacyAddress("");
    };

    hydrate();
  }, [value, provinces, loadDistricts, loadWards]);

  // ── Notify parent ──────────────────────────────────────────────────────────
  // NOTE: onChange is intentionally omitted from deps — we use onChangeRef instead
  // to avoid the inline arrow function prop causing an infinite re-render loop.
  useEffect(() => {
    if (fullAddress) { onChangeRef.current(fullAddress); return; }
    if (legacyAddress && !hasEdited) { onChangeRef.current(legacyAddress); return; }
    onChangeRef.current("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullAddress, legacyAddress, hasEdited]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const markEdited = () => { setHasEdited(true); setLegacyAddress(""); };

  const handleProvince = async (e) => {
    const code = e.target.value;
    markEdited();
    setProvinceCode(code);
    setDistrictCode(""); setWardCode("");
    setDistricts([]); setWards([]);
    const dists = await loadDistricts(code);
    setDistricts(dists);
  };

  const handleDistrict = async (e) => {
    const code = e.target.value;
    markEdited();
    setDistrictCode(code);
    setWardCode(""); setWards([]);
    const ws = await loadWards(code);
    setWards(ws);
  };

  const handleWard = (e) => { markEdited(); setWardCode(e.target.value); };
  const handleStreet = (e) => { markEdited(); setStreet(e.target.value); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Legacy address hint */}
      {legacyAddress && !fullAddress && !hasEdited && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Địa chỉ đang lưu: <strong>{legacyAddress}</strong> — Chọn lại bên dưới để cập nhật.</span>
        </div>
      )}

      {/* Row 1: Province + District */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Tỉnh / Thành phố *</label>
          <select
            id="hq-province"
            value={provinceCode}
            onChange={handleProvince}
            className={SELECT_CLS}
          >
            <option value="">
              {loadingProvince ? "Đang tải..." : "Chọn tỉnh/thành phố"}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.displayName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Quận / Huyện *</label>
          <select
            id="hq-district"
            value={districtCode}
            onChange={handleDistrict}
            disabled={!provinceCode || loadingDistrict}
            className={SELECT_CLS}
          >
            <option value="">
              {loadingDistrict ? "Đang tải..." : "Chọn quận/huyện"}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Ward + Street */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Phường / Xã *</label>
          <select
            id="hq-ward"
            value={wardCode}
            onChange={handleWard}
            disabled={!districtCode || loadingWard}
            className={SELECT_CLS}
          >
            <option value="">
              {loadingWard ? "Đang tải..." : "Chọn phường/xã"}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Số nhà / Tên đường</label>
          <input
            id="hq-street"
            type="text"
            value={street}
            onChange={handleStreet}
            placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Preview */}
      {(fullAddress || (legacyAddress && !hasEdited)) && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {fullAddress || legacyAddress}
          </span>
        </div>
      )}
    </div>
  );
};

export default HeadquartersAddressPicker;
