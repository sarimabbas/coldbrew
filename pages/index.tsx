import type { NextPage } from "next";
import Head from "next/head";
import { useDebounce } from "use-debounce";
import CaskGrid from "../components/CaskGrid";
import DownloadDialog from "../components/DownloadDialog";
import Navbar from "../components/Navbar";
import { trpc } from "../lib/trpc";
import useSearch from "../lib/useSearch";
import { useCreateSession } from "../lib/useSession";

const Home: NextPage = () => {
  useCreateSession();

  const { searchQuery } = useSearch();
  const [debouncedSearchQuery] = useDebounce(searchQuery, 80);
  const { data } = trpc.useQuery(["getCasks", { query: debouncedSearchQuery }]);

  console.log("casks:", data);

  return (
    <div>
      <Head>
        <title>Coldbrew</title>
        <meta
          name="description"
          content="A visual interface to quickly install your favorite macOS apps from Homebrew Cask"
        />
      </Head>
      <DownloadDialog />
      <Navbar />
      <CaskGrid casks={data ?? []} />
    </div>
  );
};

export default Home;
