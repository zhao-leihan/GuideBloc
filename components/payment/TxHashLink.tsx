"use client";

import { ExternalLink } from "lucide-react";
import { getExplorerTxLink } from "@/lib/crypto/networkConfig";

interface TxHashLinkProps {
  hash: string;
  explorer?: "avalanche";
  className?: string;
}

export default function TxHashLink({
  hash,
  className = "",
}: TxHashLinkProps) {
  const truncated = `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  return (
    <a
      href={getExplorerTxLink(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs ${className}`}
    >
      {truncated}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
