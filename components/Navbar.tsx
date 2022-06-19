import { RefreshIcon } from "@heroicons/react/solid";
import cx from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useIsFetching } from "react-query";
import Cart from "./Cart";
import Search from "./Search";
import ThemeToggle from "./ThemeToggle";
import ToggleSelected from "./ToggleSelected";

const Navbar = () => {
  const isFetching = useIsFetching();

  const onNavbarScroll = useCallback(() => {
    const amountScrolled = document.scrollingElement?.scrollTop ?? 0;
    if (amountScrolled > 5) {
      setShowNavbarBorder(true);
    } else {
      setShowNavbarBorder(false);
    }
  }, []);

  const [showNavbarBorder, setShowNavbarBorder] = useState<boolean>(false);
  useEffect(() => {
    document.addEventListener("scroll", onNavbarScroll);
    return () => {
      document.removeEventListener("scroll", onNavbarScroll);
    };
  }, [onNavbarScroll]);

  return (
    <div
      className={cx(
        "sticky top-0 backdrop-blur-md p-4  border-b flex justify-between items-center flex-wrap gap-4 z-10 transition-all duration-75",
        {
          "border-solid": showNavbarBorder,
          "border-none": !showNavbarBorder,
        }
      )}
    >
      {/* left */}
      <div className="flex flex-col gap-4 flex-1">
        {/* text */}
        <div className="">
          <h1 className="font-bold">Coldbrew</h1>
          <h2>
            A visual interface to quickly install your favorite macOS apps from
            Homebrew Cask
          </h2>
        </div>
        {/* bottom */}
        <div className="flex gap-8 items-center justify-between flex-wrap">
          <div className="flex gap-8 items-center flex-wrap flex-1">
            <Search />
            <ThemeToggle />
            {/* <ToggleSelected /> */}
            {isFetching > 0 ? (
              <RefreshIcon className="h-4 animate-spin opacity-50" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          <div>
            <Cart />
          </div>
        </div>
      </div>
      {/* right */}
      <div></div>
    </div>
  );
};

export default Navbar;
