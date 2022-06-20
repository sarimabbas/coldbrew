import { atom } from "jotai";
import { ICask } from ".";

export const showDownloadDialogAtom = atom<boolean>(false);

export const casksMapAtom = atom<Record<string, ICask>>({});

export const showSelectedOnlyAtom = atom<boolean>(false);

export const navbarHeightAtom = atom<number>(0);
