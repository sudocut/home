"use client";

import { useState } from "react";
import { Halftone } from "@/components/Halftone";

type Props = {
  art?: string | undefined;
  frame: string;
  pitch: number;
};

export function ChannelArtwork({ art, frame, pitch }: Props) {
  const [failed, setFailed] = useState(false);

  if (!art || failed) return <Halftone className="sc-tick-art" pitch={pitch} src={frame} />;

  return (
    <span className="sc-tick-art sc-tick-profile">
      <img
        alt=""
        className="sc-tick-avatar"
        decoding="async"
        height={256}
        onError={() => setFailed(true)}
        src={art}
        width={256}
      />
    </span>
  );
}
