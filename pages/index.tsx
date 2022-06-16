import { useAtomValue, useSetAtom } from "jotai";
import type { NextPage } from "next";
import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import DownloadDialog from "../components/DownloadDialog";
import Navbar from "../components/Navbar";
import { getApps, IGetApps } from "../lib";
import { casksMapAtom, searchQueryAtom } from "../lib/store";
import { useEffect, useCallback } from "react";

const CaskGridNoSSR = dynamic(() => import("../components/CaskGrid"), {
  ssr: false,
});

interface Props {
  apps: IGetApps;
}

const Home: NextPage<Props> = ({ apps }) => {
  const { casksMap, casksList } = apps;

  // search query to filter by
  const searchQuery = useAtomValue(searchQueryAtom);
  const filteredCasks = casksList.filter((c) => {
    const caskName = c.name ?? c.cask;
    return caskName.toLowerCase().includes(searchQuery);
  });

  // set cask maps in global state
  const setCasksMap = useSetAtom(casksMapAtom);
  const setCasksCallback = useCallback(() => {
    console.log("setting cassks map ");
    setCasksMap(casksMap);
  }, [casksMap, setCasksMap]);
  useEffect(() => {
    setCasksCallback();
  }, [setCasksCallback]);

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
      <CaskGridNoSSR casksList={filteredCasks} />
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
