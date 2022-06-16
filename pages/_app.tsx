import "../styles/globals.css";
import type { AppProps } from "next/app";
import { NextQueryParamProvider } from "next-query-params";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NextQueryParamProvider>
      <Component {...pageProps} />
    </NextQueryParamProvider>
  );
}

export default MyApp;
