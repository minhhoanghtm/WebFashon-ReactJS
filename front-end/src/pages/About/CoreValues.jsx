const values = [
  {
    title: "Uy tín",
    description: "Minh bạch trong từng sản phẩm và cam kết với khách hàng.",
  },
  {
    title: "Sáng tạo",
    description: "Luôn đổi mới để mỗi lựa chọn đều có dấu ấn riêng.",
  },
  {
    title: "Tận tâm",
    description: "Chăm chút từ tư vấn, đóng gói đến hậu mãi.",
  },
  {
    title: "Bền vững",
    description: "Hướng đến những giá trị lâu dài trong phong cách sống.",
  },
];

const CoreValues = () => {
  return (
    <section
      className="about-section about-values"
      aria-labelledby="about-values-title"
    >
      <div className="about-section__header about-section__header--center">
        <span className="about-section__eyebrow">Giá trị cốt lõi</span>
        <h2 id="about-values-title">Những điều chúng tôi theo đuổi</h2>
      </div>

      <div className="about-values__timeline">
        {values.map((value, index) => (
          <article className="about-card about-values__item" key={value.title}>
            <span className="about-values__number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{value.title}</h3>
            <p>{value.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CoreValues;
