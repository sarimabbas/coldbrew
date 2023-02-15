import React from "react";
import cx from "classnames";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = ({ children, ...delegated }) => {
  return (
    <select
      {...delegated}
      className={cx(
        "appearance-none text-center relative p-2 surface edges chisel",
        delegated.className
      )}
    >
      {children}
    </select>
  );
};

export default Select;
