export const shopTools = [
  {
    name: "search_products",
    description:
      "Tìm kiếm sản phẩm theo tên, danh mục, khoảng giá. Dùng khi khách hỏi 'có áo nào không', 'tìm quần jeans', 'sản phẩm dưới 500k'",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Tên hoặc từ khóa sản phẩm, ví dụ: áo thun, quần jean",
        },
        category_slug: {
          type: "string",
          description: "Slug danh mục sản phẩm, ví dụ: ao-thun, quan-jean",
        },
        min_price: {
          type: "number",
          description: "Giá tối thiểu của sản phẩm, ví dụ: 100000",
        },
        max_price: {
          type: "number",
          description: "Giá tối đa của sản phẩm, ví dụ: 500000",
        },
      },
    },
  },
  {
    name: "get_product_details",
    description:
      "Lấy thông tin chi tiết của sản phẩm (giá, màu sắc, kích thước, tồn kho, mô tả). Dùng khi khách hỏi 'xem thông tin áo thể thao', 'chi tiết sản phẩm này'... Có thể dùng ID, tên sản phẩm hoặc từ khóa.",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "ID hoặc Tên sản phẩm",
        },
        slug: {
          type: "string",
          description: "Slug của sản phẩm",
        },
        keyword: {
          type: "string",
          description: "Tên sản phẩm hoặc từ khóa (ví dụ: Áo thể thao, Áo thun basic)",
        },
      },
    },
  },
  {
    name: "check_order_status",
    description:
      "Kiểm tra trạng thái đơn hàng theo ID. Dùng khi khách hỏi 'tình trạng đơn hàng của tôi thế nào', 'đơn hàng #12345 đang ở đâu?'",
    parameters: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "ID của đơn hàng cần kiểm tra trạng thái",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "get_my_vouchers",
    description:
      "Lấy thông tin chi tiết về voucher theo ID. Dùng khi khách hỏi 'tôi có voucher nào không', 'voucher #ABC123 còn hạn không?'",
    parameters: {
      type: "object",
      properties: {
        voucher_id: {
          type: "string",
          description: "ID của voucher cần lấy thông tin chi tiết",
        },
      },
      required: ["voucher_id"],
    },
  },
  {
    name: "get_vouchers",
    description:
      "Lấy danh sách voucher theo trạng thái. Dùng khi khách hỏi 'tôi có voucher nào không', 'có voucher nào đang hoạt động không?'",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_categories",
    description: "Lấy danh sách danh mục sản phẩm",
    parameters: {
      type: "object",
      properties: {},
    },
  },

  {
    name: "get_product_reviews",
    description:
      "Lấy đánh giá của sản phẩm. Dùng khi khách hỏi 'sản phẩm này review thế nào', 'khách hàng đánh giá ra sao'",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "ID sản phẩm" },
      },
      required: ["product_id"],
    },
  },
];
