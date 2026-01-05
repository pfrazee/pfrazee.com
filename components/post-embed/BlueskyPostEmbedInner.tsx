'use client'

import { useEffect } from "react";

export default function BlueskyPostEmbed({uri, cid}: {uri: string; cid: string}){
  useEffect(() => {
    // Manually load the bluesky widgets script if not already present
    // @ts-ignore gonna bluesky
    if (typeof window !== 'undefined' && window.bluesky && window.bluesky.scan) {
      // @ts-ignore gonna bluesky
      window.bluesky.scan();
    } else {
      const script = document.createElement('script');
      script.src = 'https://embed.bsky.app/static/embed.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, [])

  return (
    <blockquote className="bluesky-embed" data-bluesky-uri={uri} data-bluesky-cid={cid} data-bluesky-embed-color-mode="system" suppressHydrationWarning></blockquote>
  )
}