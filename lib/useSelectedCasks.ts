import { useAtomValue } from "jotai";
import {
  decodeDelimitedArray,
  encodeDelimitedArray,
  QueryParamConfig,
  useQueryParam,
} from "next-query-params";
import { ICask } from ".";
import { casksMapAtom } from "./store";

export const CommaArrayParam: QueryParamConfig<
  (string | null)[] | null | undefined,
  (string | null)[] | null | undefined
> = {
  encode: (arr) => encodeDelimitedArray(arr, ","),
  decode: (arrStr) => decodeDelimitedArray(arrStr, ","),
};

export const CASKS_QUERY_PARAM_KEY = "casks";

const useSelectedCasks = () => {
  const [casksParam, setCasksParam] = useQueryParam(
    CASKS_QUERY_PARAM_KEY,
    CommaArrayParam
  );

  // to toggle a cask in the selected list, add/remove it from the query params
  const toggleSelectedCask = (cask: ICask) => {
    if (casksParam?.includes(cask.cask)) {
      setCasksParam((prev) => prev?.filter((c) => c !== cask.cask));
    } else {
      setCasksParam((prev) => [...(prev ?? []), cask.cask]);
    }
  };

  // a util to check selected status
  const isSelected = (cask: ICask) => {
    return casksParam?.includes(cask.cask);
  };

  // derive cask state from query param
  const casksMap = useAtomValue(casksMapAtom);
  const selectedCasks: ICask[] = [];
  (casksParam ?? []).forEach((c) => {
    if (c && c in casksMap) {
      selectedCasks.push(casksMap[c]);
    }
  });

  return {
    isSelected,
    toggleSelectedCask,
    selectedCasks,
    casksParam,
  };
};

export default useSelectedCasks;
