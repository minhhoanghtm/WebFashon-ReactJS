import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getPageBySlugService } from "@/services/page.service";
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
        const data = await getPageBySlugService("about-us").catch(() => 
          getPageBySlugService("about").catch(() => null)
        );
        
        // Handle if API returns { page, sections } or flat object
        const page = data?.page || data;
        const sections = data?.sections || data?.page?.sections || [];

        if (sections && sections.length > 0) {
          const storySec = sections.find((s) => s.type === "story");
          if (storySec?.data?.content) {
            setAboutUsHtml(storySec.data.content);
          }
        } else if (page && page.content) {
          setAboutUsHtml(page.content);
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
