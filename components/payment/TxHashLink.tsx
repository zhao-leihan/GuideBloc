import { ExternalLink } from "lucide-react";

interface TxHashLinkProps {
  hash: string;
  explorer?: "polygon" | "base" | "ethereum";
  className?: string;
}

const EXPLORERS: Record<string, string> = {
  polygon: "https://amoy.polygonscan.com",
  base: "https://basescan.org",
  ethereum: "https://etherscan.io",
};

export default function TxHashLink({
  hash,
  explorer = "polygon",
  className = "",
}: TxHashLinkProps) {
  const baseUrl = EXPLORERS[explorer] || EXPLORERS.polygon;
  const truncated = `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  return (
    <a
      href={`${baseUrl}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs ${className}`}
    >
      {truncated}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
