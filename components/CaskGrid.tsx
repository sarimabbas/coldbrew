import React from "react";
import { Masonry } from "masonic";
import { ICask } from "../lib";
import CaskCard from "./CaskCard";
import { useAtomValue } from "jotai";
import { searchQueryAtom } from "../lib/store";

interface ICaskGridProps {
  casks: ICask[];
}

const CaskGrid = ({ casks }: ICaskGridProps) => {
  const searchQuery = useAtomValue(searchQueryAtom);

  return (
    <div className="p-4">
      <Masonry
        columnGutter={20}
        items={casks}
        key={searchQuery}
        itemKey={(data, idx) => data?.cask}
        render={({ index, data, width }) => <CaskCard cask={data} />}
      />
    </div>
  );
};

export default CaskGrid;
