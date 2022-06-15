import React from "react";
import { Masonry } from "masonic";
import { ICask } from "../lib";
import CaskCard from "./CaskCard";

interface ICaskGridProps {
  casks: ICask[];
}

const CaskGrid = ({ casks }: ICaskGridProps) => {
  return (
    <div className="p-4">
      <Masonry
        columnGutter={20}
        items={casks}
        itemKey={(data, idx) => data.cask}
        render={({ index, data, width }) => <CaskCard cask={data} />}
      />
    </div>
  );
};

export default CaskGrid;
