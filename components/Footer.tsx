import Link from "next/link";
import React from "react";
import SessionPill from "./SessionPill";

const Footer = () => {
  return (
    <div className="flex items-center justify-between p-4 flex-wrap">
      <Link href="/about" className="underline">
        About
      </Link>
      <SessionPill />
    </div>
  );
};

export default Footer;
