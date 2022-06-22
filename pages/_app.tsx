import "../styles/globals.css";
import { withTRPC } from "@trpc/next";
import { AppType } from "next/dist/shared/lib/utils";
import { AppRouter } from "./api/trpc/[trpc]";
import { ReactQueryDevtools } from "react-query/devtools";
import { httpLink } from "@trpc/client/links/httpLink";
import { ThemeProvider } from "next-themes";
import splitbee from "@splitbee/web";
import { useEffect } from "react";

const MyApp: AppType = ({ Component, pageProps }) => {
  useEffect((): void => {
    splitbee.init({
      token: process.env.NEXT_PUBLIC_SPLITBEE_TOKEN,
      scriptUrl: "/bee.js",
      apiUrl: "/_hive",
    });
  }, []);

  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </ThemeProvider>
  );
};

export default withTRPC<AppRouter>({
  config({ ctx }) {
    // sarim: if stuff is failing in prod, make sure to look at this
    const url = process.env.TRPC_SERVER_URL || "http://localhost:3000/api/trpc";
    return {
      url,
      // disabling batching to avoid optimistic mutation flicker in react query
      links: [
        httpLink({
          url: "/api/trpc",
        }),
      ],
    };
  },
  ssr: false,
})(MyApp);
