import React from "react";
import SessionPill from "./SessionPill";

const Footer = () => {
  return (
    <div className="flex items-center justify-between p-4 flex-wrap">
      <a href="/about" className="underline">
        About
      </a>
      <SessionPill />
    </div>
  );
};

export default Footer;
