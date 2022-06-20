import { SearchIcon } from "@heroicons/react/solid";
import useSearch from "../lib/useSearch";

const Search = () => {
  const { setSearchQuery } = useSearch();

  return (
    <div className="flex gap-2 items-center relative flex-1">
      <SearchIcon className="h-4 z-20 absolute left-4" />
      <input
        type="text"
        className="w-fit px-4 py-2 pl-10 surface edges rounded-full"
        onChange={(e) => setSearchQuery(e.currentTarget.value.toLowerCase())}
      />
    </div>
  );
};

export default Search;
