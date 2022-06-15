import { atom } from "jotai";
import { ICask } from ".";

export const selectedCasksAtom = atom<ICask[]>([]);

export const searchQueryAtom = atom<string>("");

export const showDownloadDialogAtom = atom<boolean>(false);
