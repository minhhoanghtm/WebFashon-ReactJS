import storyImage from "../Home/assets/lookbook-summer.jpg";

const BrandStory = () => {
  return (
    <section
      className="about-section about-story"
      aria-labelledby="about-story-title"
    >
      <div className="about-story__content">
        <span className="about-section__eyebrow">Giới thiệu thương hiệu</span>
        <h2 id="about-story-title">Chúng tôi là ai?</h2>
        <p>
          Được thành lập với mong muốn mang đến trải nghiệm mua sắm thời trang
          tốt nhất, thương hiệu luôn đặt chất lượng sản phẩm và sự hài lòng của
          khách hàng lên hàng đầu.
        </p>
      </div>

      <div className="about-story__media" aria-hidden="true">
        <img src={storyImage} alt="" />
      </div>
    </section>
  );
};

export default BrandStory;
