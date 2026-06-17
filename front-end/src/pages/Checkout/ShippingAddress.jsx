import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { MapPin } from "lucide-react";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "../../services/location.service";
import { findFallbackProvince, vietnamAddressData } from "./VietnamAddressData";

const REQUIRED_MESSAGES = {
  province: "Vui lòng chọn tỉnh/thành phố.",
  district: "Vui lòng chọn quận/huyện.",
  ward: "Vui lòng chọn phường/xã.",
  street: "Vui lòng nhập số nhà và tên đường.",
};

const removeAdministrativePrefix = (name = "") =>
  name
    .replace(/^(Thành phố|Tỉnh)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearchText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/^(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeProvince = (province) => ({
  code: String(province.code),
  name: province.name,
  displayName: removeAdministrativePrefix(province.name),
  districts: province.districts || [],
});

const normalizeDistrict = (district) => ({
  code: String(district.code),
  name: district.name,
  wards: district.wards || [],
});

const normalizeWard = (ward) => ({
  code: String(ward.code),
  name: ward.name,
});

const parseAddressParts = (address = "") => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 4) {
    return null;
  }

  const provinceName = parts.at(-1);
  const districtName = parts.at(-2);
  const wardName = parts.at(-3);
  const street = parts.slice(0, -3).join(", ");

  return { street, wardName, districtName, provinceName };
};

const findByName = (items, targetName, getName = (item) => item.name) => {
  const normalizedTarget = normalizeSearchText(targetName);
  return items.find((item) => {
    const normalizedName = normalizeSearchText(getName(item));
    const normalizedDisplayName = normalizeSearchText(item.displayName || "");
    return (
      normalizedName === normalizedTarget ||
      normalizedDisplayName === normalizedTarget
    );
  });
};

const buildFullAddress = ({ street, ward, district, province }) => {
  if (!street?.trim() || !ward || !district || !province) {
    return "";
  }

  return [
    street.trim(),
    ward.name,
    district.name,
    province.displayName || province.name,
  ].join(", ");
};

const ShippingAddress = forwardRef(({ value = "", onChange }, ref) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [street, setStreet] = useState("");
  const [legacyAddress, setLegacyAddress] = useState(value);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const initialAddressParsedRef = useRef(false);
  const provinceRef = useRef(null);
  const districtRef = useRef(null);
  const wardRef = useRef(null);
  const streetRef = useRef(null);

  const selectedProvince = useMemo(
    () => provinces.find((province) => province.code === provinceCode),
    [provinceCode, provinces]
  );

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.code === districtCode),
    [districtCode, districts]
  );

  const selectedWard = useMemo(
    () => wards.find((ward) => ward.code === wardCode),
    [wardCode, wards]
  );

  const fullAddress = useMemo(
    () =>
      buildFullAddress({
        street,
        ward: selectedWard,
        district: selectedDistrict,
        province: selectedProvince,
      }),
    [selectedDistrict, selectedProvince, selectedWard, street]
  );

  const loadDistricts = useCallback(async (nextProvinceCode) => {
    if (!nextProvinceCode) {
      return [];
    }

    setLoadingDistrict(true);
    try {
      const province = await getDistrictsService(nextProvinceCode);
      const apiDistricts = Array.isArray(province?.districts)
        ? province.districts.map(normalizeDistrict)
        : [];

      if (apiDistricts.length > 0) {
        return apiDistricts;
      }
    } catch (error) {
      console.error("Không thể tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistrict(false);
    }

    return (findFallbackProvince(nextProvinceCode)?.districts || []).map(
      normalizeDistrict
    );
  }, []);

  const loadWards = useCallback(async (nextDistrictCode, nextProvinceCode = provinceCode) => {
    if (!nextDistrictCode) {
      return [];
    }

    setLoadingWard(true);
    try {
      const district = await getWardsService(nextDistrictCode);
      const apiWards = Array.isArray(district?.wards)
        ? district.wards.map(normalizeWard)
        : [];

      if (apiWards.length > 0) {
        return apiWards;
      }
    } catch (error) {
      console.error("Không thể tải danh sách phường/xã:", error);
    } finally {
      setLoadingWard(false);
    }

    const fallbackDistrict = findFallbackProvince(nextProvinceCode)?.districts.find(
      (district) => district.code === String(nextDistrictCode)
    );

    return (fallbackDistrict?.wards || []).map(normalizeWard);
  }, [provinceCode]);

  const markEdited = () => {
    setHasUserEdited(true);
    setLegacyAddress("");
  };

  const validateFields = useCallback(() => {
    if (legacyAddress && !hasUserEdited && !fullAddress) {
      return {};
    }

    const nextErrors = {};

    if (!provinceCode) nextErrors.province = REQUIRED_MESSAGES.province;
    if (!districtCode) nextErrors.district = REQUIRED_MESSAGES.district;
    if (!wardCode) nextErrors.ward = REQUIRED_MESSAGES.ward;
    if (!street.trim()) nextErrors.street = REQUIRED_MESSAGES.street;

    return nextErrors;
  }, [districtCode, fullAddress, hasUserEdited, legacyAddress, provinceCode, street, wardCode]);

  const validate = useCallback(() => {
    const nextErrors = validateFields();
    setErrors(nextErrors);
    setTouched({
      province: true,
      district: true,
      ward: true,
      street: true,
    });

    const firstErrorKey = ["province", "district", "ward", "street"].find(
      (key) => nextErrors[key]
    );

    if (firstErrorKey) {
      const focusMap = {
        province: provinceRef,
        district: districtRef,
        ward: wardRef,
        street: streetRef,
      };
      focusMap[firstErrorKey].current?.focus();
    }

    return Object.keys(nextErrors).length === 0;
  }, [validateFields]);

  useImperativeHandle(ref, () => ({
    validate,
    getAddress: () => fullAddress || legacyAddress,
  }));

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvince(true);
      try {
        const apiProvinces = await getProvincesService();
        const nextProvinces = Array.isArray(apiProvinces)
          ? apiProvinces.map(normalizeProvince)
          : [];

        setProvinces(
          nextProvinces.length > 0
            ? nextProvinces
            : vietnamAddressData.map(normalizeProvince)
        );
      } catch (error) {
        console.error("Không thể tải danh sách tỉnh/thành phố:", error);
        setProvinces(vietnamAddressData.map(normalizeProvince));
      } finally {
        setLoadingProvince(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    if (fullAddress) {
      onChange(fullAddress);
      return;
    }

    if (legacyAddress && !hasUserEdited) {
      onChange(legacyAddress);
      return;
    }

    onChange("");
  }, [fullAddress, hasUserEdited, legacyAddress, onChange]);

  useEffect(() => {
    const hydrateFromExistingAddress = async () => {
      if (!value || initialAddressParsedRef.current || provinces.length === 0) {
        return;
      }

      initialAddressParsedRef.current = true;
      const parsedAddress = parseAddressParts(value);

      if (!parsedAddress) {
        setLegacyAddress(value);
        return;
      }

      const matchedProvince = findByName(
        provinces,
        parsedAddress.provinceName,
        (province) => province.displayName || province.name
      );

      if (!matchedProvince) {
        setLegacyAddress(value);
        return;
      }

      const nextDistricts = await loadDistricts(matchedProvince.code);
      const matchedDistrict = findByName(
        nextDistricts,
        parsedAddress.districtName
      );

      if (!matchedDistrict) {
        setLegacyAddress(value);
        return;
      }

      const nextWards = await loadWards(matchedDistrict.code, matchedProvince.code);
      const matchedWard = findByName(nextWards, parsedAddress.wardName);

      if (!matchedWard) {
        setLegacyAddress(value);
        return;
      }

      setProvinceCode(matchedProvince.code);
      setDistricts(nextDistricts);
      setDistrictCode(matchedDistrict.code);
      setWards(nextWards);
      setWardCode(matchedWard.code);
      setStreet(parsedAddress.street);
      setLegacyAddress("");
    };

    hydrateFromExistingAddress();
  }, [loadDistricts, loadWards, provinces, value]);

  useEffect(() => {
    const nextErrors = validateFields();
    setErrors(nextErrors);
  }, [validateFields]);

  const handleProvinceChange = async (event) => {
    const nextProvinceCode = event.target.value;
    markEdited();
    setTouched((current) => ({ ...current, province: true }));
    setProvinceCode(nextProvinceCode);
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);

    const nextDistricts = await loadDistricts(nextProvinceCode);
    setDistricts(nextDistricts);
  };

  const handleDistrictChange = async (event) => {
    const nextDistrictCode = event.target.value;
    markEdited();
    setTouched((current) => ({ ...current, district: true }));
    setDistrictCode(nextDistrictCode);
    setWardCode("");
    setWards([]);

    const nextWards = await loadWards(nextDistrictCode);
    setWards(nextWards);
  };

  const handleWardChange = (event) => {
    markEdited();
    setTouched((current) => ({ ...current, ward: true }));
    setWardCode(event.target.value);
  };

  const handleStreetChange = (event) => {
    markEdited();
    setTouched((current) => ({ ...current, street: true }));
    setStreet(event.target.value);
  };

  const fieldClassName = (fieldName) =>
    `checkout-address-field ${
      touched[fieldName] && errors[fieldName] ? "checkout-address-field--error" : ""
    }`;

  const renderError = (fieldName) =>
    touched[fieldName] && errors[fieldName] ? (
      <p className="checkout-address-error">{errors[fieldName]}</p>
    ) : null;

  return (
    <section className="checkout-address">
      <div className="checkout-address__header">
        <div className="checkout-address__icon" aria-hidden="true">
          <MapPin className="h-4 w-4" />
        </div>
        <div>
          <h4>Địa chỉ giao hàng</h4>
          <p>Chọn khu vực nhận hàng và nhập số nhà, tên đường.</p>
        </div>
      </div>

      {legacyAddress && !fullAddress && !hasUserEdited && (
        <div className="checkout-address__legacy">
          <span>Địa chỉ đang lưu</span>
          <strong>{legacyAddress}</strong>
        </div>
      )}

      <div className="checkout-address__grid">
        <div className="checkout-address__control">
          <label htmlFor="shipping-province">Tỉnh / Thành phố</label>
          <select
            ref={provinceRef}
            id="shipping-province"
            value={provinceCode}
            onChange={handleProvinceChange}
            onBlur={() =>
              setTouched((current) => ({ ...current, province: true }))
            }
            className={fieldClassName("province")}
            aria-invalid={Boolean(touched.province && errors.province)}
            aria-describedby="shipping-province-error"
          >
            <option value="">
              {loadingProvince ? "Đang tải tỉnh/thành phố..." : "Chọn tỉnh/thành phố"}
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.displayName}
              </option>
            ))}
          </select>
          <div id="shipping-province-error">{renderError("province")}</div>
        </div>

        <div className="checkout-address__control">
          <label htmlFor="shipping-district">Quận / Huyện</label>
          <select
            ref={districtRef}
            id="shipping-district"
            value={districtCode}
            onChange={handleDistrictChange}
            onBlur={() =>
              setTouched((current) => ({ ...current, district: true }))
            }
            disabled={!provinceCode || loadingDistrict}
            className={fieldClassName("district")}
            aria-invalid={Boolean(touched.district && errors.district)}
            aria-describedby="shipping-district-error"
          >
            <option value="">
              {loadingDistrict ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
            </option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
          <div id="shipping-district-error">{renderError("district")}</div>
        </div>

        <div className="checkout-address__control">
          <label htmlFor="shipping-ward">Phường / Xã</label>
          <select
            ref={wardRef}
            id="shipping-ward"
            value={wardCode}
            onChange={handleWardChange}
            onBlur={() => setTouched((current) => ({ ...current, ward: true }))}
            disabled={!districtCode || loadingWard}
            className={fieldClassName("ward")}
            aria-invalid={Boolean(touched.ward && errors.ward)}
            aria-describedby="shipping-ward-error"
          >
            <option value="">
              {loadingWard ? "Đang tải phường/xã..." : "Chọn phường/xã"}
            </option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
          <div id="shipping-ward-error">{renderError("ward")}</div>
        </div>

        <div className="checkout-address__control">
          <label htmlFor="shipping-street">Số nhà / Tên đường</label>
          <input
            ref={streetRef}
            id="shipping-street"
            type="text"
            value={street}
            onChange={handleStreetChange}
            onBlur={() =>
              setTouched((current) => ({ ...current, street: true }))
            }
            placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
            className={fieldClassName("street")}
            aria-invalid={Boolean(touched.street && errors.street)}
            aria-describedby="shipping-street-error"
          />
          <div id="shipping-street-error">{renderError("street")}</div>
        </div>
      </div>

      <div className="checkout-address__preview">
        <span>Địa chỉ đầy đủ</span>
        <strong>
          {fullAddress || legacyAddress || "Địa chỉ sẽ hiển thị sau khi bạn nhập đủ thông tin."}
        </strong>
      </div>
    </section>
  );
});

ShippingAddress.displayName = "ShippingAddress";

export default ShippingAddress;
