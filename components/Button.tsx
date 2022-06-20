import React from "react";
import cx from "classnames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button: React.FC<ButtonProps> = ({
  disabled,
  children,
  ...delegated
}) => {
  return (
    <button
      {...delegated}
      className={cx("relative p-2 surface edges chisel", {
        "opacity-50 cursor-not-allowed": disabled,
      })}
    >
      {children}
    </button>
  );
};

export default Button;
