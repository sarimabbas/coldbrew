import { InboxInIcon } from "@heroicons/react/solid";
import { useSetAtom } from "jotai";
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
        if (selectedCasks.length < 1) return;
        showDownloadDialog(true);
      }}
    >
      {selectedCasks.length > 0 && (
        <div className="absolute top-0 right-0 h-6 w-6 px-1 bg-red-600 rounded-full text-white font-mono flex items-center justify-center text-xs translate-x-3 -translate-y-3 shadow-md">
          {selectedCasks.length}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <div>Your apps</div>
        <InboxInIcon className={"h-5"} />
      </div>
    </Button>
  );
};

export default Cart;
