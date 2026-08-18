"use client";

import { useEffect, useRef, useState } from "react";
import { Halftone } from "@/components/Halftone";

type Props = {
  art?: string | undefined;
  frame: string;
  pitch: number;
};

export function ChannelArtwork({ art, frame, pitch }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const previousArt = useRef(art);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (previousArt.current === art) return;
    previousArt.current = art;
    setFailed(false);
  }, [art]);

  useEffect(() => {
    const node = image.current;
    if (!art || failed || !node) return;
    if (node.complete && node.naturalWidth === 0) setFailed(true);
  }, [art, failed]);

  if (!art || failed) return <Halftone className="sc-tick-art" pitch={pitch} src={frame} />;

  return (
    <span className="sc-tick-art sc-tick-profile">
      {/* biome-ignore lint/performance/noImgElement: Native img keeps same-origin profile fallback under local control. */}
      <img
        alt=""
        className="sc-tick-avatar"
        decoding="async"
        height={256}
        onError={() => setFailed(true)}
        ref={image}
        src={art}
        width={256}
      />
    </span>
  );
}
