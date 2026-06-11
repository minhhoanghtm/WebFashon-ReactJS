const SectionHeader = ({ id, eyebrow, title, subtitle }) => {
  return (
    <div className="home-section-header">
      {eyebrow && <span>{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
};

export default SectionHeader;
