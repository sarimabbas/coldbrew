import { useAtomValue } from "jotai";
import type { NextPage } from "next";
import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useMemo } from "react";
import DownloadDialog from "../components/DownloadDialog";
import Navbar from "../components/Navbar";
import { getApps, IGetApps } from "../lib";
import { searchQueryAtom } from "../lib/store";
import useSession from "../lib/useSession";

const CaskGridNoSSR = dynamic(() => import("../components/CaskGrid"), {
  ssr: false,
});

interface Props {
  apps: IGetApps;
}

const Home: NextPage<Props> = ({ apps }) => {
  const { casksList } = apps;
  useSession();

  // search query to filter by
  const searchQuery = useAtomValue(searchQueryAtom);
  const filteredCasks = useMemo(() => {
    if (casksList.length > 0) {
      return casksList.filter((c) => {
        const caskName = c.name ?? c.cask;
        return caskName.toLowerCase().includes(searchQuery);
      });
    }
    return [];
  }, [casksList, searchQuery]);

  return (
    // dark:bg-black dark:text-white
    <div className="">
      <Head>
        <title>Coldbrew</title>
        <meta
          name="description"
          content="A visual interface to quickly install your favorite macOS apps from Homebrew Cask"
        />
      </Head>
      <DownloadDialog />
      <Navbar />
      <CaskGridNoSSR casksList={filteredCasks ?? []} />
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const apps = await getApps();

  return {
    props: {
      apps,
    },
  };
};
