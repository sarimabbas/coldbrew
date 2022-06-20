import { Cask } from "@prisma/client";
import { memo } from "react";
import { useSession } from "../lib/useSession";
import CaskCard from "./CaskCard";

interface ICaskGridProps {
  casks: Cask[];
}

const CaskGrid = (props: ICaskGridProps) => {
  const { casks } = props;
  const { isCaskSelected, toggleSelectedCask } = useSession();

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {casks.map((c) => (
        <CaskCard
          key={c.id}
          cask={c}
          isSelected={isCaskSelected(c)}
          toggleSelected={() => toggleSelectedCask(c)}
        />
      ))}
    </div>
  );
};

CaskGrid.displayName = "CaskGrid";

export default CaskGrid;
