import { atom } from "jotai";
import { ICask } from ".";

export const selectedCasksAtom = atom<ICask[]>([]);
