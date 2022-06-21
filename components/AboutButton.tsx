import Link from "next/link";
import React from "react";
import Button from "./Button";

const AboutButton = () => {
  return (
    <Link href="/about">
      <Button>About</Button>
    </Link>
  );
};

export default AboutButton;
