import * as Switch from "@radix-ui/react-switch";
import cx from "classnames";
import { useAtom } from "jotai";
import { showSelectedOnlyAtom } from "../lib/store";

export const useSelectedToggle = () => {
  const [isSelected, setIsSelected] = useAtom(showSelectedOnlyAtom);
  return {
    isSelected,
    setIsSelected,
  };
};

const ToggleSelected = () => {
  const { isSelected, setIsSelected } = useSelectedToggle();

  return (
    <div className="flex gap-2 items-center border dark:border-gray-500 rounded-md shadow-sm p-2">
      <Switch.Root
        className="w-10 h-5 bg-black dark:bg-white rounded-full relative shadow-sm"
        onClick={() => setIsSelected((prev) => !prev)}
      >
        <Switch.Thumb
          className={cx(
            "block w-3 h-3 bg-white dark:bg-black rounded-full transition-transform will-change-transform",
            {
              "translate-x-1": !isSelected,
              "translate-x-6": isSelected,
            }
          )}
        />
      </Switch.Root>
      <div className="text-sm">Filter selected</div>
    </div>
  );
};

export default ToggleSelected;
