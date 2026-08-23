import { ExternalLink } from "lucide-react";

interface TxHashLinkProps {
  hash: string;
  explorer?: "avalanche";
  className?: string;
}

const EXPLORERS: Record<string, string> = {
  avalanche: "https://snowtrace.io",
};

export default function TxHashLink({
  hash,
  explorer = "avalanche",
  className = "",
}: TxHashLinkProps) {
  const baseUrl = EXPLORERS[explorer] || "https://snowtrace.io";
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
