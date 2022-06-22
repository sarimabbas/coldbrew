import Script from "next/script";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head />
      <body className="dark:bg-black dark:text-white">
        <Main />
        <NextScript />
        <Script
          src="https://cdn.splitbee.io/sb.js"
          strategy="afterInteractive"
        ></Script>
      </body>
    </Html>
  );
}
