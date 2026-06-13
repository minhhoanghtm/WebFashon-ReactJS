import { BadgeCheck, HeartHandshake, Sparkles } from "lucide-react";

const missions = [
  {
    title: "Chất lượng",
    description: "Cam kết mang đến sản phẩm chất lượng cao.",
    icon: <BadgeCheck size={22} aria-hidden="true" />,
  },
  {
    title: "Phong cách",
    description: "Theo đuổi xu hướng nhưng vẫn giữ nét riêng.",
    icon: <Sparkles size={22} aria-hidden="true" />,
  },
  {
    title: "Khách hàng",
    description: "Lấy khách hàng làm trung tâm trong mọi hoạt động.",
    icon: <HeartHandshake size={22} aria-hidden="true" />,
  },
];

const MissionSection = () => {
  return (
    <section
      className="about-section about-mission"
      aria-labelledby="about-mission-title"
    >
      <div className="about-section__header">
        <span className="about-section__eyebrow">Sứ mệnh</span>
        <h2 id="about-mission-title">Tạo nên trải nghiệm mua sắm đáng tin cậy</h2>
      </div>

      <div className="about-mission__grid">
        {missions.map((mission) => (
          <article className="about-card about-mission__card" key={mission.title}>
            <div className="about-card__icon">
              {mission.icon}
            </div>
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MissionSection;
