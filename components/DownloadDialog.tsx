import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import * as Dialog from "@radix-ui/react-dialog";
import splitbee from "@splitbee/web";
import { useAtom } from "jotai";
import Link from "next/link";
import { SplitbeeEvents } from "../lib/analytics";
import { showDownloadDialogAtom } from "../lib/store";
import useClipboard from "../lib/useClipboard";
import { useSession } from "../lib/useSession";
import CaskCard from "./CaskCard";

interface IDownloadDialogProps {}

const DownloadDialog = (props: IDownloadDialogProps) => {
  const { session, isCaskSelected, toggleSelectedCask } = useSession();
  const [isOpen, setIsOpen] = useAtom(showDownloadDialogAtom);

  const shellCommand = `curl -sSL "${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }api/download?session=${encodeURIComponent(session?.id ?? "")}" | sh`;

  const brewfileLink = `${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }api/download?session=${encodeURIComponent(session?.id ?? "")}&file=true`;

  const shareLink = `${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://coldbrew.doom.sh/"
  }?session=${encodeURIComponent(session?.id ?? "")}`;

  const { copyText: copyShellCommand, isHot: copyShellCommandHot } =
    useClipboard({ text: shellCommand });

  const { copyText: copyShareLink, isHot: copyShareLinkHot } = useClipboard({
    text: shareLink,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed top-0 bottom-0 left-0 right-0 z-20 grid overflow-y-auto surface backdrop-blur-sm place-items-center">
          <Dialog.Content className="!shadow-lg p-4 z-30 max-w-[90vw] md:min-w-[50vw] md:max-w-[60vw] material edges chisel relative">
            <Dialog.Title className="text-lg font-bold">Your apps</Dialog.Title>
            <Dialog.Description>
              Here&apos;s everything you have selected
            </Dialog.Description>
            <Dialog.Close className="absolute right-4 top-4">
              <XCircleIcon className="h-6" />
            </Dialog.Close>
            {/* app grid */}
            <div
              className="flex gap-4 py-1 my-4 mb-8 overflow-x-auto"
              style={{}}
            >
              {session?.casks.map((c) => {
                return (
                  <div className="flex-shrink-0 " key={c.id}>
                    <CaskCard
                      cask={c}
                      isSelected={isCaskSelected(c)}
                      toggleSelected={() => toggleSelectedCask(c)}
                    />
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
              <button
                onClick={() => {
                  splitbee.track(SplitbeeEvents.ClickedCopyDownload);
                  copyShellCommand();
                }}
              >
                {copyShellCommandHot ? (
                  <CheckCircleIcon className="h-8" />
                ) : (
                  <ClipboardDocumentIcon className="h-8" />
                )}
              </button>
            </div>
            <pre
              className="p-4 my-4 overflow-x-auto surface edges chisel"
              onClick={() => splitbee.track(SplitbeeEvents.ClickedLinkDownload)}
            >
              <code>{shellCommand}</code>
            </pre>
            <div className="text-sm">
              Or just download the{" "}
              <span className="text-sky-500">
                <Link
                  href={brewfileLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    splitbee.track(SplitbeeEvents.ClickedLinkBrewfile)
                  }
                >
                  Brewfile
                </Link>
                .{" "}
              </span>
              If you experience an error, you might need to install{" "}
              <span className="text-sky-500">
                <a href="https://brew.sh" target="_blank" rel="noreferrer">
                  Homebrew
                </a>{" "}
              </span>
              first.
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
              <button
                onClick={() => {
                  splitbee.track(SplitbeeEvents.ClickedCopyShare);
                  copyShareLink();
                }}
              >
                {copyShareLinkHot ? (
                  <CheckCircleIcon className="h-8" />
                ) : (
                  <ClipboardDocumentIcon className="h-8" />
                )}
              </button>
            </div>
            <pre
              className="p-4 mt-4 overflow-x-auto surface edges chisel"
              onClick={() => splitbee.track(SplitbeeEvents.ClickedLinkShare)}
            >
              <code>{shareLink}</code>
            </pre>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DownloadDialog;
