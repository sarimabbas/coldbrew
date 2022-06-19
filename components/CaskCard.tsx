import { Cask } from "@prisma/client";
import cx from "classnames";
import { CSSProperties } from "react";

interface ICaskCardProps {
  cask: Cask;
  isSelected: boolean;
  toggleSelected: (cask: Cask) => void;
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

const CaskCard = ({
  cask,
  toggleSelected,
  isSelected,
  className,
  style,
  disabled,
}: ICaskCardProps) => {
  return (
    <div
      onClick={() => {
        if (disabled) return;
        toggleSelected(cask);
      }}
      style={{
        contentVisibility: "auto",
        ...style,
      }}
      className={cx(
        "h-full border shadow-sm p-4 rounded-md flex flex-col justify-between gap-4 cursor-pointer dark:border-gray-500 dark:shadow-gray-400 hover:bg-gray-50 hover:dark:bg-gray-800 transition-colors",
        {
          "border-yellow-300 shadow-yellow-300": isSelected,
        },
        {
          "opacity-60": disabled,
        },
        className
      )}
    >
      <div className="flex gap-4 justify-between">
        <div>{cask.name || cask.id}</div>
        {/* todo(sarim): make image take constant space */}
        {cask.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            onLoad={(event) =>
              (event.currentTarget.style.visibility = "visible")
            }
            src={cask.logoUrl}
            alt={cask.name ?? cask.id}
            loading="lazy"
            className="h-10 max-h-10 w-10 object-cover rounded-full overflow-hidden flex-shrink-0 border invisible"
          />
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="font-mono text-xs">{cask.id}</div>
        <div className="flex gap-4 opacity-50 text-sm">
          <div className="">#{cask.ranking}</div>
          <div>{cask.installCount} installs</div>
        </div>
      </div>
    </div>
  );
};

export default CaskCard;
