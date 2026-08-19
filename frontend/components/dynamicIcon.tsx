// components/ui/DynamicIcon.tsx

import * as Icons from "lucide-react";
import { LucideIcon, LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name?: string;
  fallback?: keyof typeof Icons;
  w: number;
  h: number;
}

const DynamicIcon = ({
  name,
  fallback = "Wrench",
  w = 6,
  h = 6,
  ...props
}: DynamicIconProps) => {
  // wind -> Wind
  // arrow-right -> ArrowRight
  const formattedName = name
    ?.split(/[-_ ]/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");

  const IconComponent =
    (formattedName &&
      Icons[
        formattedName as keyof typeof Icons
      ]) ||
    Icons[fallback];

  const LucideComponent =
    IconComponent as LucideIcon;

  return <LucideComponent {...props} width={w} height={h} />;
};

export default DynamicIcon;