import heroImage from "../Home/assets/hero-atelier.jpg";

const AboutHero = () => {
  return (
    <section
      className="about-hero"
      style={{ backgroundImage: `url(${heroImage})` }}
      aria-labelledby="about-hero-title"
    >
      <div className="about-hero__overlay" />
      <div className="about-hero__content">
        <span className="about-hero__eyebrow">404Studio</span>
        <h1 id="about-hero-title">Câu chuyện thương hiệu</h1>
        <p>
          Chúng tôi mang đến những sản phẩm thời trang hiện đại, chất lượng và
          phù hợp với phong cách sống của bạn.
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
