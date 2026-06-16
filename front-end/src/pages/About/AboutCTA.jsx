import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AboutCTA = () => {
  return (
    <section className="about-section about-cta" aria-labelledby="about-cta-title">
      <div className="about-cta__content">
        <span className="about-section__eyebrow">Bộ sưu tập mới</span>
        <h2 id="about-cta-title">Sẵn sàng khám phá bộ sưu tập của chúng tôi?</h2>
      </div>

      <Link className="about-cta__button" to="/">
        Xem sản phẩm
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
};

export default AboutCTA;
