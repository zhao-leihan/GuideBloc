"use client";

interface DotsLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
}

export default function DotsLoader({ className = "", size = "md", isDark }: DotsLoaderProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";

  // IF conditional: Light mode -> Blue (primary), Dark mode -> White
  let dotColor = "bg-primary dark:bg-white";
  if (isDark === true) {
    dotColor = "bg-white";
  } else if (isDark === false) {
    dotColor = "bg-primary";
  }

  return (
    <div className={`inline-flex items-center justify-center gap-1.5 ${className}`}>
      <span className={`${dotSize} ${dotColor} rounded-full animate-bounce [animation-delay:-0.3s]`} />
      <span className={`${dotSize} ${dotColor} rounded-full animate-bounce [animation-delay:-0.15s]`} />
      <span className={`${dotSize} ${dotColor} rounded-full animate-bounce`} />
    </div>
  );
}
