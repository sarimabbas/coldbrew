import { useAtom } from "jotai";
import { ICask } from ".";
import { selectedCasksAtom } from "./store";

const useSelectedCasks = () => {
  const [selectedCasks, setSelectedCasks] = useAtom(selectedCasksAtom);

  // to toggle a cask in the selected list, add/remove it from the query params
  const toggleSelectedCask = (cask: ICask) => {
    if (!!selectedCasks.find((c) => c.cask === cask.cask)) {
      setSelectedCasks((prev) => prev.filter((c) => c.cask !== cask.cask));
    } else {
      setSelectedCasks((prev) => [...prev, cask]);
    }
  };

  // a util to check selected status
  const isSelected = (cask: ICask) => {
    return !!selectedCasks.find((c) => c.cask === cask.cask);
  };

  return {
    isSelected,
    toggleSelectedCask,
    selectedCasks,
  };
};

export default useSelectedCasks;
