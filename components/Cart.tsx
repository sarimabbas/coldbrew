import { InboxIcon } from "@heroicons/react/24/solid";
import { track } from "@vercel/analytics";
import { useSetAtom } from "jotai";
import { VercelAnalyticsEvents } from "../lib/analytics";
import { showDownloadDialogAtom } from "../lib/store";
import { useSession } from "../lib/useSession";
import Button from "./Button";

const Cart = () => {
  const { session } = useSession();
  const showDownloadDialog = useSetAtom(showDownloadDialogAtom);
  const selectedCasks = session?.casks ?? [];

  return (
    <Button
      disabled={selectedCasks.length < 1}
      onClick={() => {
        track(VercelAnalyticsEvents.ClickedCart, {
          numberOfCasks: selectedCasks.length,
        });
        if (selectedCasks.length < 1) return;
        showDownloadDialog(true);
      }}
    >
      {selectedCasks.length > 0 && (
        <div className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 px-1 font-mono text-xs text-white translate-x-3 -translate-y-3 bg-red-600 rounded-full shadow-md">
          {selectedCasks.length}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div>Your apps</div>
        <InboxIcon className={"h-5"} />
      </div>
    </Button>
  );
};

export default Cart;
