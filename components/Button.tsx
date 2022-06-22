import React, { forwardRef } from "react";
import cx from "classnames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button: React.FC<ButtonProps> = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ disabled, children, ...delegated }, ref) => {
  return (
    <button
      {...delegated}
      ref={ref}
      className={cx("relative p-2 surface edges chisel", {
        "opacity-50 cursor-not-allowed": disabled,
      })}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
