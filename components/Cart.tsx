import { InboxInIcon } from "@heroicons/react/solid";
import cx from "classnames";
import { useSetAtom } from "jotai";
import { showDownloadDialogAtom } from "../lib/store";
import { useSession } from "../lib/useSession";

const Cart = () => {
  const { session } = useSession();
  const showDownloadDialog = useSetAtom(showDownloadDialogAtom);
  const selectedCasks = session?.casks ?? [];

  return (
    <button
      className={cx(
        "relative p-2 shadow-sm rounded-md border hover:bg-gray-50/60 hover:dark:bg-gray-800/60 transition-colors dark:border-gray-500 dark:shadow-gray-400",
        {
          "opacity-50 cursor-not-allowed": selectedCasks.length < 1,
        }
      )}
      disabled={selectedCasks.length < 1}
      onClick={() => showDownloadDialog(true)}
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
    </button>
  );
};

export default Cart;
