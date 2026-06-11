import { ArrowDown } from "lucide-react";
import { heroContent } from "./homeMockData";

const HeroBanner = () => {
  const scrollToProducts = () => {
    document
      .getElementById("san-pham-noi-bat")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="home-hero"
      style={{ backgroundImage: `url(${heroContent.image})` }}
      aria-labelledby="home-hero-title"
    >
      <div className="home-hero__overlay" />
      <div className="home-hero__content">
        <span className="home-hero__eyebrow">{heroContent.eyebrow}</span>
        <h1 id="home-hero-title">{heroContent.title}</h1>
        <p>{heroContent.subtitle}</p>
        <button type="button" onClick={scrollToProducts}>
          {heroContent.buttonLabel}
          <ArrowDown size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default HeroBanner;
