import Head from "next/head";
import Link from "next/link";
import React from "react";
import SessionPill from "../components/SessionPill";
import { useSession } from "../lib/useSession";

const About = () => {
  const { session } = useSession();
  return (
    <div className="container p-4 mx-auto prose-sm prose dark:prose-invert prose-a:underline-offset-4">
      <Head>
        <title>Coldbrew - About</title>
      </Head>
      <h3>About Coldbrew</h3>
      <p>
        Coldbrew is a hobby project by me,{" "}
        <Link href="https://twitter.com/sarim_ok">@sarim_ok</Link> 👋. For the
        longest time, I&apos;ve wanted a visual, one-click tool to install all
        the apps I want.
      </p>
      <p>
        So I built Coldbrew! You can select all the apps you want, and Coldbrew
        will install them with Homebrew Cask. This is better than going to each
        app&apos;s website separately and starting all the downloads manually.
      </p>
      <p>
        This does mean that Homebrew is a prerequisite. You can install it on
        your macOS machine here:{" "}
        <a href="https://brew.sh/" target="_blank" rel="noreferrer">
          {" "}
          https://brew.sh/
        </a>
      </p>
      <p>
        Coldbrew does nothing fancy, it just invokes <code>brew bundle</code>.
        Now, you <i>could</i> just write out your desired casks in a dotfile and
        sync that between computers, but I think there is something fun about
        browsing through the most popular apps in a visual way. In fact, I
        provide a way for you to download your selection as a{" "}
        <code>Brewfile</code>, if you so desire.
      </p>
      <h3>Security</h3>
      <p>Just a little note about security, if you are curious.</p>
      <p>
        I don&apos;t require login to use Coldbrew. Instead, I create an
        anonymous session for each user.
      </p>
      {session?.id && (
        <>
          <p>Here is yours:</p>
          <SessionPill className="w-fit" />
        </>
      )}
      <p>
        Sessions are immutable once you end your Coldbrew browser session. Then
        you can&apos;t add or remove apps from them any more.
      </p>
      <p>
        You can share the link to your session with someone else. When they
        visit the share link, every app linked to your session will be copied
        over to a new session for them.
      </p>
      <p>
        Oh also, you should know that I collect page-view data with Vercel
        analytics.
      </p>
      <h3>Built with</h3>
      <p>
        Coldbrew was built with the Homebrew API, the results of which are
        stored in a Neon database. The data is queried by a NextJS app with
        React Query and TRPC. The app is styled with Tailwind.
      </p>
    </div>
  );
};

export default About;
