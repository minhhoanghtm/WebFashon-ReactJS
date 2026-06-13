import { ArrowUpRight } from "lucide-react";
import { lookbookItems } from "./homeMockData";
import SectionHeader from "./SectionHeader";

const LookbookSection = () => {
  return (
    <section
      className="home-section home-lookbook"
      aria-labelledby="home-lookbook-title"
    >
      <SectionHeader
        id="home-lookbook-title"
        eyebrow="Cảm hứng mặc đẹp"
        title="Gợi ý phối đồ"
        subtitle="Lấy cảm hứng từ những bộ sưu tập được chọn lọc"
      />

      <div className="home-lookbook__grid">
        {lookbookItems.map((item) => (
          <article
            className="home-lookbook-card"
            key={item.id}
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <div className="home-lookbook-card__shade" />
            <div className="home-lookbook-card__content">
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <a href="#san-pham-noi-bat">
                Xem sản phẩm
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default LookbookSection;
