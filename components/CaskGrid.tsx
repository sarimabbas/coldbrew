import { useAtomValue } from "jotai";
import { Masonry } from "masonic";
import { ICask } from "../lib";
import { searchQueryAtom } from "../lib/store";
import CaskCard from "./CaskCard";

interface ICaskGridProps {
  casksList: ICask[];
}

const CaskGrid = ({ casksList }: ICaskGridProps) => {
  const searchQuery = useAtomValue(searchQueryAtom);

  return (
    <div className="p-4">
      <Masonry
        columnGutter={20}
        items={casksList}
        key={searchQuery}
        itemKey={(data, idx) => data?.cask}
        render={({ index, data, width }) => <CaskCard cask={data} />}
      />
    </div>
  );
};

export default CaskGrid;
