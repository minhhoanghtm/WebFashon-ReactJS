import { Headphones, PackageCheck, RefreshCw, Truck } from "lucide-react";

const reasons = [
  {
    title: "Sản phẩm chất lượng",
    icon: <PackageCheck size={23} aria-hidden="true" />,
  },
  {
    title: "Giao hàng nhanh chóng",
    icon: <Truck size={23} aria-hidden="true" />,
  },
  {
    title: "Hỗ trợ tận tình",
    icon: <Headphones size={23} aria-hidden="true" />,
  },
  {
    title: "Đổi trả linh hoạt",
    icon: <RefreshCw size={23} aria-hidden="true" />,
  },
];

const WhyChooseUs = () => {
  return (
    <section
      className="about-section about-why"
      aria-labelledby="about-why-title"
    >
      <div className="about-section__header">
        <span className="about-section__eyebrow">Vì sao chọn chúng tôi?</span>
        <h2 id="about-why-title">Mua sắm dễ dàng, an tâm và có gu</h2>
      </div>

      <div className="about-why__grid">
        {reasons.map((reason) => (
          <article className="about-card about-why__card" key={reason.title}>
            {reason.icon}
            <h3>{reason.title}</h3>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;
