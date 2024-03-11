import { httpLink } from "@trpc/client/links/httpLink";
import { withTRPC } from "@trpc/next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { AppType } from "next/dist/shared/lib/utils";
import { ReactQueryDevtools } from "react-query/devtools";
import "../styles/globals.css";
import { AppRouter } from "./api/trpc/[trpc]";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
      <Analytics />
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
