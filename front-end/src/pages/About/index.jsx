import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AboutHero from "./AboutHero";
import BrandStory from "./BrandStory";
import MissionSection from "./MissionSection";
import CoreValues from "./CoreValues";
import WhyChooseUs from "./WhyChooseUs";
import AchievementSection from "./AchievementSection";
import AboutCTA from "./AboutCTA";
import "./about.css";

const About = () => {
  useDocumentTitle("Giới thiệu thương hiệu");

  return (
    <div className="about-page">
      <div className="about-page__container">
        <AboutHero />
        <main className="about-page__content">
          <BrandStory />
          <MissionSection />
          <CoreValues />
          <WhyChooseUs />
          <AchievementSection />
          <AboutCTA />
        </main>
      </div>
    </div>
  );
};

export default About;
