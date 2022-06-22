import fetch from "node-fetch";

export interface ICask {
  // ranking in terms of # of installs
  number: number;

  // cask name
  cask: string;

  // number of installs past 365 days
  count: string;

  // percent of total installs past 365 days
  percent: string;

  // english name
  name: string | null;

  // homepage url
  homepage: string | null;

  // logo url
  // unfortunately homebrew api does not provide this
  // currently done via clearbit
  logo: string | null;
}

const casksListEndpoint =
  "https://formulae.brew.sh/api/analytics/cask-install/365d.json";

const casksDetailEndpoint = `https://formulae.brew.sh/api/cask.json`;

interface IGetCasks {
  casksList: ICask[];
  casksCount: number;
}

// from https://formulae.brew.sh/api/cask.json
interface ICaskDetail {
  token: string;
  desc?: string;
  homepage?: string;
  name: string[];
}

// maps a cask name to metadata
type ICaskDetailMap = Record<string, ICaskDetail>;

export const getCasks = async (): Promise<IGetCasks> => {
  // get the top popular casks
  const popularListResponse = await fetch(casksListEndpoint);
  const popularListData = await popularListResponse.json();
  const totalItems = (popularListData as any)?.["total_items"] as number;
  const items = ((popularListData as any)?.["items"] as ICask[]) ?? [];

  // put details into hashmap
  const detailResponse = await fetch(casksDetailEndpoint);
  const detailData = (await detailResponse.json()) as ICaskDetail[];
  const detailMap = detailData.reduce((prev: ICaskDetailMap, curr) => {
    return {
      ...prev,
      [curr.token]: {
        ...curr,
      },
    };
  }, {});

  // update the casks with details
  items.forEach((item) => {
    item.homepage = detailMap[item.cask]?.homepage ?? null;
    item.name = detailMap[item.cask]?.name?.[0] ?? null;
    if (item.homepage) {
      item.logo = `https://logo.clearbit.com/${detailMap[item.cask]?.homepage}`;
    }
  });

  return {
    casksList: items,
    casksCount: totalItems,
  };
};

// -------

export interface IGetApps {
  casksList: ICask[];
  casksCount: number;
}

export const getApps = async (): Promise<IGetApps> => {
  const { casksCount, casksList } = await getCasks();

  return {
    casksList,
    casksCount,
  };
};
