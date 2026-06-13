import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getWebsiteSettingsService } from "@/services/websiteSettings.service";
import { Loader2 } from "lucide-react";
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
  const [aboutUsHtml, setAboutUsHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        setLoading(true);
        const settings = await getWebsiteSettingsService();
        if (settings?.policies?.aboutUs) {
          setAboutUsHtml(settings.policies.aboutUs);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin giới thiệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutUs();
  }, []);

  if (loading) {
    return (
      <div className="about-loading-container">
        <Loader2 className="about-loading-spinner" />
        <span>Đang tải thông tin giới thiệu...</span>
      </div>
    );
  }

  return (
    <div className="about-page">
      <div className="about-page__container">
        <AboutHero />
        <main className="about-page__content">
          {aboutUsHtml ? (
            <section 
              className="about-page__custom-content ql-editor"
              dangerouslySetInnerHTML={{ __html: aboutUsHtml }}
            />
          ) : (
            <>
              <BrandStory />
              <MissionSection />
              <CoreValues />
              <WhyChooseUs />
              <AchievementSection />
              <AboutCTA />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default About;
