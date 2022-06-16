import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { ICask } from ".";

export const selectedCasksAtom = atom<ICask[]>([]);

export const searchQueryAtom = atom<string>("");

export const showDownloadDialogAtom = atom<boolean>(false);

export const casksMapAtom = atom<Record<string, ICask>>({});

const sessionStorageAdapter = createJSONStorage<string>(() => sessionStorage);
export const sessionIdentifierAtom = atomWithStorage<string>(
  "coldbrewSessionId",
  "",
  sessionStorageAdapter
);
