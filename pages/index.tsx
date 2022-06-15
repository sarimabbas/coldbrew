import type { NextPage } from "next";
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Image from "next/image";
import { getApps, IGetApps } from "../lib";

interface Props {
  apps: IGetApps;
}

const Home: NextPage<Props> = ({ apps }) => {
  return (
    <div className="p-4">
      <h1 className="font-bold">Coldbrew</h1>
      <h2>
        A visual interface to quickly install your favorite macOS apps from
        Homebrew Cask
      </h2>
      <br />
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{
          gridAutoRows: "1fr",
        }}
      >
        {apps.casksResponse.casks.map((cask) => {
          return (
            <div
              key={cask.cask}
              className="border shadow-sm p-4 rounded-md flex flex-col justify-between"
            >
              {/* header */}
              <div className="flex gap-4 justify-between">
                <div>{cask.name || cask.cask}</div>
                {cask.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    onError={(event) =>
                      (event.currentTarget.style.display = "none")
                    }
                    src={cask.logo}
                    alt={cask.name ?? cask.cask}
                    loading="lazy"
                    className="h-10 w-10 object-cover rounded-full overflow-hidden flex-shrink-0 border"
                  />
                )}
              </div>
              {/* meta */}
              <div className="flex flex-col gap-4">
                <div className="font-mono text-xs">{cask.cask}</div>
                <div className="flex gap-4 opacity-50 text-sm">
                  <div className="">#{cask.number}</div>
                  <div>{cask.count} installs</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
