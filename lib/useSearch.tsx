import { atom, useAtom } from "jotai";

export const searchQueryAtom = atom<string>("");

const useSearch = () => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  return {
    searchQuery,
    setSearchQuery,
  };
};

export default useSearch;
