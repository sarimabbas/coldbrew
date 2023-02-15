import LastUpdated from "./LastUpdated";
import SessionPill from "./SessionPill";

const Footer = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-4">
      <SessionPill />
      <LastUpdated />
    </div>
  );
};

export default Footer;
