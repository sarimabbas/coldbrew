import { useAtomValue } from "jotai";
import type { NextPage } from "next";
import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { getApps, IGetApps } from "../lib";
import { searchQueryAtom } from "../lib/store";

const CaskGridNoSSR = dynamic(() => import("../components/CaskGrid"), {
  ssr: false,
});

interface Props {
  apps: IGetApps;
}

const Home: NextPage<Props> = ({ apps }) => {
  const casks = apps.casksResponse.casks ?? [];
  const searchQuery = useAtomValue(searchQueryAtom);
  const filteredCasks = casks.filter((c) => {
    const caskName = c.name ?? c.cask;
    return caskName.toLowerCase().includes(searchQuery);
  });

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
      <Navbar />
      <CaskGridNoSSR casks={filteredCasks} />
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
    // regenerate the page every 12 hours
    revalidate: 43200,
  };
};
