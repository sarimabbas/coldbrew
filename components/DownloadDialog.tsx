import {
  CheckCircleIcon,
  ClipboardCopyIcon,
  XCircleIcon,
} from "@heroicons/react/solid";
import * as Dialog from "@radix-ui/react-dialog";
import { useAtom } from "jotai";
import Link from "next/link";
import { showDownloadDialogAtom } from "../lib/store";
import useClipboard from "../lib/useClipboard";
import useSelectedCasks from "../lib/useSelectedCasks";
import CaskCard from "./CaskCard";

interface IDownloadDialogProps {}

const DownloadDialog = (props: IDownloadDialogProps) => {
  const { casksParam, selectedCasks } = useSelectedCasks();
  const [isOpen, setIsOpen] = useAtom(showDownloadDialogAtom);

  const shellCommand = `curl -sSL ${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }api/download?casks=${encodeURIComponent((casksParam ?? []).join(","))} | sh`;

  const brewfileLink = `${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }api/download?casks=${encodeURIComponent(
    (casksParam ?? []).join(",")
  )}&file=true`;

  const shareLink = `${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }?casks=${encodeURIComponent((casksParam ?? []).join(","))}`;

  const { copyText: copyShellCommand, isHot: copyShellCommandHot } =
    useClipboard({ text: shellCommand });

  const { copyText: copyShareLink, isHot: copyShareLinkHot } = useClipboard({
    text: shareLink,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-slate-300/50 backdrop-blur-sm top-0 right-0 left-0 bottom-0 fixed grid place-items-center overflow-y-auto z-20">
          <Dialog.Content className="shadow-lg p-4 border rounded-md z-30 min-w-[50%] max-w-[60%] bg-white relative">
            <Dialog.Title className="font-bold text-lg">Your apps</Dialog.Title>
            <Dialog.Description>
              Here&apos;s everything you have selected
            </Dialog.Description>
            <Dialog.Close className="absolute right-4 top-4">
              <XCircleIcon className="h-6" />
            </Dialog.Close>
            {/* app grid */}
            <div
              className="flex gap-4 overflow-x-scroll my-4 mb-8 py-1"
              style={{}}
            >
              {selectedCasks.map((c) => {
                return (
                  <div className=" flex-shrink-0" key={c.cask}>
                    <CaskCard cask={c} />
                  </div>
                );
              })}
            </div>
            {/* download */}
            <div className="flex items-end justify-between">
              <div>
                <div className="font-bold">Download</div>
                <div>Run the command below in your Terminal</div>
              </div>
              <button onClick={() => copyShellCommand()}>
                {copyShellCommandHot ? (
                  <CheckCircleIcon className="h-8" />
                ) : (
                  <ClipboardCopyIcon className="h-8" />
                )}
              </button>
            </div>
            <pre className="bg-slate-800 text-white p-4 rounded-md my-4 overflow-x-scroll">
              <code>{shellCommand}</code>
            </pre>
            <div className="text-sm">
              Or just download the{" "}
              <span className="text-sky-500">
                <Link href={brewfileLink} target="_blank" rel="noreferrer">
                  Brewfile
                </Link>
              </span>
            </div>
            <div className="mb-8"></div>
            {/* share */}
            <div className="flex items-end justify-between">
              <div>
                <div className="font-bold">Share</div>
                <div>
                  Share your selection with someone else, or bookmark it for
                  later
                </div>
              </div>
              <button onClick={() => copyShareLink()}>
                {copyShareLinkHot ? (
                  <CheckCircleIcon className="h-8" />
                ) : (
                  <ClipboardCopyIcon className="h-8" />
                )}
              </button>
            </div>
            <pre className="bg-slate-800 text-white p-4 rounded-md mt-4 overflow-x-scroll">
              <code>{shareLink}</code>
            </pre>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DownloadDialog;
