export const vietnamAddressData = [
  {
    code: "79",
    name: "Thành phố Hồ Chí Minh",
    districts: [
      {
        code: "760",
        name: "Quận 1",
        wards: [
          { code: "26734", name: "Phường Bến Nghé" },
          { code: "26740", name: "Phường Bến Thành" },
          { code: "26743", name: "Phường Cầu Kho" },
        ],
      },
      {
        code: "770",
        name: "Quận 3",
        wards: [
          { code: "27118", name: "Phường Võ Thị Sáu" },
          { code: "27127", name: "Phường 4" },
          { code: "27139", name: "Phường 12" },
        ],
      },
      {
        code: "765",
        name: "Quận Bình Thạnh",
        wards: [
          { code: "26965", name: "Phường 1" },
          { code: "26977", name: "Phường 14" },
          { code: "26992", name: "Phường 25" },
        ],
      },
    ],
  },
  {
    code: "1",
    name: "Thành phố Hà Nội",
    districts: [
      {
        code: "1",
        name: "Quận Ba Đình",
        wards: [
          { code: "1", name: "Phường Phúc Xá" },
          { code: "4", name: "Phường Trúc Bạch" },
          { code: "25", name: "Phường Liễu Giai" },
        ],
      },
      {
        code: "5",
        name: "Quận Cầu Giấy",
        wards: [
          { code: "167", name: "Phường Dịch Vọng" },
          { code: "175", name: "Phường Nghĩa Tân" },
          { code: "181", name: "Phường Yên Hòa" },
        ],
      },
      {
        code: "2",
        name: "Quận Hoàn Kiếm",
        wards: [
          { code: "37", name: "Phường Chương Dương" },
          { code: "40", name: "Phường Hàng Bạc" },
          { code: "67", name: "Phường Tràng Tiền" },
        ],
      },
    ],
  },
  {
    code: "48",
    name: "Thành phố Đà Nẵng",
    districts: [
      {
        code: "490",
        name: "Quận Hải Châu",
        wards: [
          { code: "20194", name: "Phường Hải Châu I" },
          { code: "20203", name: "Phường Thạch Thang" },
          { code: "20212", name: "Phường Hòa Thuận Tây" },
        ],
      },
      {
        code: "493",
        name: "Quận Sơn Trà",
        wards: [
          { code: "20260", name: "Phường An Hải Bắc" },
          { code: "20263", name: "Phường An Hải Đông" },
          { code: "20275", name: "Phường Mân Thái" },
        ],
      },
      {
        code: "494",
        name: "Quận Ngũ Hành Sơn",
        wards: [
          { code: "20285", name: "Phường Mỹ An" },
          { code: "20287", name: "Phường Khuê Mỹ" },
          { code: "20290", name: "Phường Hòa Quý" },
        ],
      },
    ],
  },
  {
    code: "92",
    name: "Thành phố Cần Thơ",
    districts: [
      {
        code: "916",
        name: "Quận Ninh Kiều",
        wards: [
          { code: "31144", name: "Phường Cái Khế" },
          { code: "31149", name: "Phường An Khánh" },
          { code: "31153", name: "Phường An Hòa" },
        ],
      },
      {
        code: "918",
        name: "Quận Bình Thủy",
        wards: [
          { code: "31201", name: "Phường Bình Thủy" },
          { code: "31207", name: "Phường Long Hòa" },
          { code: "31212", name: "Phường Trà An" },
        ],
      },
      {
        code: "919",
        name: "Quận Cái Răng",
        wards: [
          { code: "31216", name: "Phường Lê Bình" },
          { code: "31217", name: "Phường Hưng Phú" },
          { code: "31222", name: "Phường Ba Láng" },
        ],
      },
    ],
  },
];

export const findFallbackProvince = (provinceCode) =>
  vietnamAddressData.find((province) => province.code === String(provinceCode));
