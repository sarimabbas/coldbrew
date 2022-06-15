import type { NextPage } from "next";
import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { getApps, IGetApps } from "../lib";

const CaskGridNoSSR = dynamic(() => import("../components/CaskGrid"), {
  ssr: false,
});

interface Props {
  apps: IGetApps;
}

const Home: NextPage<Props> = ({ apps }) => {
  const casks = apps.casksResponse.casks ?? [];

  return (
    // dark:bg-black dark:text-white
    <div className="">
      {/* navbar */}
      <div className="sticky top-0 backdrop-blur-md p-4 bg-white/30 border-b border-opacity-50 flex justify-between items-center flex-wrap gap-4 z-50">
        {/* left */}
        <div>
          <h1 className="font-bold">Coldbrew</h1>
          <h2>
            A visual interface to quickly install your favorite macOS apps from
            Homebrew Cask
          </h2>
        </div>
        {/* right */}
        <div>
          <button>Cart</button>
        </div>
      </div>
      <br />
      {/* grid */}
      <CaskGridNoSSR casks={casks} />
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

{
  /* <div
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4"
style={{
  gridAutoRows: "1fr",
}}
></div>  */
}
