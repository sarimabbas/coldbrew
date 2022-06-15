import React from "react";
import { ICask } from "../lib";
import cx from "classnames";
import useSelectedCasks from "../lib/useSelectedCasks";

interface ICaskCardProps {
  cask: ICask;
}

const CaskCard = ({ cask }: ICaskCardProps) => {
  const { isSelected, toggleSelectedCask } = useSelectedCasks();

  return (
    <a
      onClick={() => {
        toggleSelectedCask(cask);
      }}
      key={cask.cask}
      className={cx(
        "border shadow-sm p-4 rounded-md flex flex-col justify-between gap-4",
        {
          "border-yellow-300": isSelected(cask),
        }
      )}
    >
      {/* header */}
      <div className="flex gap-4 justify-between">
        <div>{cask.name || cask.cask}</div>
        {/* todo(sarim): make image take constant space */}
        {cask.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            onLoad={(event) =>
              (event.currentTarget.style.visibility = "visible")
            }
            src={cask.logo}
            alt={cask.name ?? cask.cask}
            loading="lazy"
            className="h-10 w-10 object-cover rounded-full overflow-hidden flex-shrink-0 border invisible"
          />
        )}
      </div>
      {/* meta */}
      <div className="flex flex-col gap-4">
        <div className="font-mono text-xs">{cask.cask}</div>
        <div className="flex gap-4 opacity-50 text-sm">
          <div className="">#{cask.number}</div>
          <div>{cask.count} installs</div>
        </div>
      </div>
    </a>
  );
};

export default CaskCard;
