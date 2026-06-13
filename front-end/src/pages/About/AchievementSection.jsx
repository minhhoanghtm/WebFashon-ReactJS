const achievements = [
  {
    value: "10.000+",
    label: "khách hàng",
  },
  {
    value: "500+",
    label: "sản phẩm",
  },
  {
    value: "5",
    label: "năm phát triển",
  },
  {
    value: "95%",
    label: "khách hàng hài lòng",
  },
];

const AchievementSection = () => {
  return (
    <section
      className="about-section about-achievement"
      aria-labelledby="about-achievement-title"
    >
      <div className="about-section__header about-section__header--center">
        <span className="about-section__eyebrow">Thành tựu</span>
        <h2 id="about-achievement-title">Những con số nổi bật</h2>
      </div>

      <div className="about-achievement__grid">
        {achievements.map((item) => (
          <article className="about-card about-achievement__card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AchievementSection;
