import { InboxInIcon, SearchIcon } from "@heroicons/react/solid";
import cx from "classnames";
import { useSetAtom } from "jotai";
import { searchQueryAtom } from "../lib/store";
import useSelectedCasks from "../lib/useSelectedCasks";

const Navbar = () => {
  const setSearchQuery = useSetAtom(searchQueryAtom);
  const { selectedCasks } = useSelectedCasks();

  return (
    <div className="sticky top-0 backdrop-blur-md p-4 bg-white/30 border-b border-opacity-50 flex justify-between items-center flex-wrap gap-4 z-50">
      {/* left */}
      <div className="flex flex-col gap-4">
        {/* text */}
        <div className="">
          <h1 className="font-bold">Coldbrew</h1>
          <h2>
            A visual interface to quickly install your favorite macOS apps from
            Homebrew Cask
          </h2>
        </div>
        {/* bottom */}
        <div className="flex gap-8 items-center">
          {/* search */}
          <div className="flex gap-2 items-center relative">
            <SearchIcon className="h-4 z-20 absolute left-4" />
            <input
              type="text"
              className="border rounded-full shadow-sm w-fit px-4 py-2 text-sm pl-10"
              onChange={(e) =>
                setSearchQuery(e.currentTarget.value.toLowerCase())
              }
            />
          </div>
          {/* cart */}
          <button
            className={cx("relative", {
              "opacity-50 cursor-not-allowed": selectedCasks.length < 1,
            })}
            disabled={selectedCasks.length < 1}
          >
            {selectedCasks.length > 0 && (
              <div className="absolute top-0 right-0 h-4 w-fit px-1 bg-red-600 rounded-full text-white font-mono flex items-center justify-center text-xs translate-x-2 -translate-y-2 shadow-md">
                {selectedCasks.length}
              </div>
            )}
            <InboxInIcon className={"h-8"} />
          </button>
        </div>
      </div>
      {/* right */}
      <div></div>
    </div>
  );
};

export default Navbar;
