import {
  LightningBoltIcon,
  ColumnsIcon,
  MixIcon,
  SunIcon,
  DesktopIcon,
  ShuffleIcon,
  FileTextIcon,
  CameraIcon,
  MoonIcon,
  PersonIcon,
  GlobeIcon,
  Crosshair2Icon,
  RocketIcon,
  ChatBubbleIcon,
  StarFilledIcon,
  HeartFilledIcon,
  MagicWandIcon,
  SewingPinFilledIcon,
  BellIcon,
  TokensIcon,
  InfoCircledIcon,
  TargetIcon,
} from "@radix-ui/react-icons";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  adventure: LightningBoltIcon,
  cultural: ColumnsIcon,
  food: MixIcon,
  nature: SunIcon,
  city: DesktopIcon,
  water: ShuffleIcon,
  historical: FileTextIcon,
  nightlife: MoonIcon,
  photography: CameraIcon,
  wellness: PersonIcon,
};

export interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = "w-6 h-6" }: CategoryIconProps) {
  const Icon = iconMap[category.toLowerCase()] || GlobeIcon;
  return <Icon className={className} />;
}

export function getCategoryIconComponent(category: string): React.ComponentType<{ className?: string }> {
  return iconMap[category.toLowerCase()] || GlobeIcon;
}

export {
  GlobeIcon as TouristIcon,
  Crosshair2Icon as GuideIcon,
  RocketIcon,
  ChatBubbleIcon,
  StarFilledIcon,
  HeartFilledIcon,
  MagicWandIcon,
  SewingPinFilledIcon,
  BellIcon,
  TokensIcon,
  InfoCircledIcon,
  TargetIcon,
};
