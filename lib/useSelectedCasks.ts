import { useAtom } from "jotai";
import { ICask } from ".";
import { selectedCasksAtom } from "./store";

const useSelectedCasks = () => {
  const [selectedCasks, setSelectedCasks] = useAtom(selectedCasksAtom);

  const toggleSelectedCask = (cask: ICask) => {
    const exists = selectedCasks.find((c) => c.cask === cask.cask);
    if (exists) {
      setSelectedCasks((prev) => prev.filter((c) => c.cask !== cask.cask));
    } else {
      setSelectedCasks((prev) => [...prev, cask]);
    }
  };

  const isSelected = (cask: ICask) => {
    return !!selectedCasks.find((c) => c.cask === cask.cask);
  };

  return {
    selectedCasks,
    toggleSelectedCask,
    isSelected,
  };
};

export default useSelectedCasks;
