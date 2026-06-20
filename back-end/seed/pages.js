import mongoose from "mongoose";
import dotenv from "dotenv";
import Page from "../src/modules/pages/page.model.js";

dotenv.config();

const seedPages = [
  {
    title: "Giới thiệu về 404Studio",
    slug: "about",
    type: "about",
    status: "published",
    displayOrder: 1,
    publishedAt: new Date(),
    excerpt: "Câu chuyện ra đời và giá trị cốt lõi của thương hiệu thời trang 404Studio.",
    seoTitle: "Về chúng tôi — 404Studio",
    seoDescription: "Tìm hiểu câu chuyện ra đời, giá trị cốt lõi và đội ngũ đứng sau thương hiệu thời trang tối giản 404Studio.",
    seoKeywords: "404studio, về chúng tôi, thời trang tối giản, thương hiệu việt nam",
    content: `
      <h2>Chúng tôi là ai?</h2>
      <p>404Studio ra đời từ một câu hỏi đơn giản: <em>"Tại sao thời trang tối giản lại phải đắt đến vậy?"</em></p>
      <p>Từ một xưởng nhỏ tại TP. Hồ Chí Minh, chúng tôi bắt đầu với niềm tin rằng phong cách cá nhân không cần nhãn hiệu xa xỉ — chỉ cần thiết kế đúng, chất liệu tốt, và giá thành trung thực.</p>
      <p>Thành lập năm 2022, 404Studio hiện phục vụ hàng nghìn khách hàng trên toàn quốc với triết lý: <strong>ít hơn nhưng tốt hơn.</strong></p>

      <h2>Giá trị cốt lõi</h2>
      <h3>🎯 Thiết kế tối giản</h3>
      <p>Loại bỏ những gì thừa. Giữ lại những gì có giá trị. Mỗi sản phẩm là một tuyên ngôn về sự tinh tế.</p>
      <h3>🌿 Chất liệu trung thực</h3>
      <p>Chúng tôi chỉ dùng vải đã qua kiểm định. Không greenwashing. Không quảng cáo thổi phồng. Bạn nhận được đúng những gì chúng tôi hứa.</p>
      <h3>✨ Phong cách cá nhân</h3>
      <p>Thời trang là ngôn ngữ — không phải đồng phục. 404Studio giúp bạn nói đúng điều bạn muốn nói mà không cần nói thêm gì.</p>

      <h2>Con số của chúng tôi</h2>
      <ul>
        <li><strong>2022</strong> — Năm thành lập</li>
        <li><strong>10.000+</strong> — Khách hàng tin tưởng</li>
        <li><strong>50+</strong> — Mẫu thiết kế mỗi năm</li>
        <li><strong>98%</strong> — Khách hàng hài lòng</li>
      </ul>

      <h2>Đội ngũ đứng sau 404Studio</h2>
      <p>Chúng tôi là những người trẻ đến từ Hà Nội và Sài Gòn — designers, stylists, và những người yêu thích sự tối giản. Không có dress code trong văn phòng. Nhưng có rất nhiều cà phê và deadline.</p>
    `,
    sections: []
  },
  {
    title: "Chính sách mua hàng",
    slug: "policy",
    type: "policy",
    status: "published",
    displayOrder: 2,
    publishedAt: new Date(),
    excerpt: "Chính sách đổi trả, vận chuyển và bảo mật thông tin của 404Studio.",
    seoTitle: "Chính sách — 404Studio",
    seoDescription: "Tìm hiểu chính sách đổi trả, vận chuyển và bảo mật thông tin khách hàng tại 404Studio.",
    seoKeywords: "chính sách đổi trả, vận chuyển, bảo mật, 404studio",
    content: `
      <h2>Chính sách đổi trả</h2>
      <p>Sản phẩm được đổi trả trong vòng <strong>7 ngày</strong> kể từ ngày nhận hàng nếu:</p>
      <ul>
        <li>Còn nguyên tem, nhãn mác</li>
        <li>Chưa qua sử dụng, giặt tẩy</li>
        <li>Có hóa đơn mua hàng</li>
      </ul>
      <p>Chi phí vận chuyển đổi trả do khách hàng chịu, trừ trường hợp lỗi từ phía 404Studio.</p>

      <h2>Chính sách vận chuyển</h2>
      <p>Miễn phí vận chuyển cho đơn hàng từ <strong>500.000đ</strong> trở lên.</p>
      <ul>
        <li>Nội thành HCM & Hà Nội: 1-2 ngày làm việc</li>
        <li>Tỉnh thành khác: 3-5 ngày làm việc</li>
      </ul>

      <h2>Chính sách bảo mật</h2>
      <p>Thông tin cá nhân của khách hàng được bảo mật tuyệt đối và <strong>không chia sẻ cho bên thứ ba</strong> dưới bất kỳ hình thức nào.</p>

      <h2>Liên hệ hỗ trợ</h2>
      <p>Hotline: <strong>0123 456 789</strong> (8:00 - 22:00 hàng ngày)</p>
      <p>Email: <strong>info@404studio.com</strong></p>
    `,
    sections: []
  },
  {
    title: "Câu hỏi thường gặp",
    slug: "faq",
    type: "faq",
    status: "published",
    displayOrder: 3,
    publishedAt: new Date(),
    excerpt: "Giải đáp các thắc mắc thường gặp khi mua sắm tại 404Studio.",
    seoTitle: "FAQ — Câu hỏi thường gặp | 404Studio",
    seoDescription: "Giải đáp các thắc mắc về size, đổi trả, thanh toán và giao hàng tại 404Studio.",
    seoKeywords: "faq, câu hỏi thường gặp, hỗ trợ, 404studio",
    content: `
      <h2>Size & Sản phẩm</h2>
      <h3>Làm thế nào để chọn size phù hợp?</h3>
      <p>Vui lòng tham khảo bảng size chi tiết trên từng trang sản phẩm. Nếu cần tư vấn thêm, liên hệ chúng tôi qua chat hoặc hotline <strong>0123 456 789</strong>.</p>
      <h3>Sản phẩm có bị phai màu sau khi giặt không?</h3>
      <p>Không. Tất cả vải của 404Studio đều được xử lý màu bền. Tuy nhiên nên giặt lạnh và không dùng chất tẩy mạnh để giữ màu lâu nhất.</p>

      <h2>Đơn hàng & Thanh toán</h2>
      <h3>Tôi có thể thanh toán bằng những hình thức nào?</h3>
      <p>404Studio hỗ trợ: COD (tiền mặt khi nhận hàng), chuyển khoản ngân hàng, VNPay và MoMo.</p>
      <h3>Tôi có thể hủy đơn hàng không?</h3>
      <p>Bạn có thể hủy đơn trong vòng <strong>1 giờ</strong> sau khi đặt hàng. Sau thời gian này, đơn đã được xử lý và không thể hủy.</p>

      <h2>Giao hàng & Đổi trả</h2>
      <h3>Thời gian giao hàng bao lâu?</h3>
      <p>Nội thành HCM & Hà Nội: 1-2 ngày. Tỉnh thành khác: 3-5 ngày làm việc.</p>
      <h3>Tôi muốn đổi size, phải làm gì?</h3>
      <p>Liên hệ hotline hoặc inbox fanpage trong vòng 7 ngày kể từ khi nhận hàng. Chúng tôi sẽ hướng dẫn quy trình đổi hàng nhanh nhất.</p>
    `,
    sections: []
  }
];

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_CONNECTIONSTRING;

    if (!mongoUri) {
      throw new Error("MONGO_CONNECTIONSTRING is not defined in the .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB");

    for (const pageData of seedPages) {
      const existing = await Page.findOne({ slug: pageData.slug });

      if (existing) {
        console.log(`⚠️  Bỏ qua "${pageData.title}" — slug "${pageData.slug}" đã tồn tại`);
        continue;
      }

      await Page.create(pageData);
      console.log(`✅ Đã tạo trang: "${pageData.title}"`);
    }

    console.log("\n🎉 Seed pages hoàn tất!");
  } catch (err) {
    console.error("❌ Lỗi seed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }
};

run();