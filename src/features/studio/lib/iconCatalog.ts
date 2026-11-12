import {
  Baby,
  Bell,
  BookOpen,
  BookOpenText,
  Calendar,
  Church,
  Clock,
  Cross,
  Flame,
  Gift,
  Globe,
  HandCoins,
  HandHeart,
  Heart,
  Info,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Music,
  Phone,
  Quote,
  Radio,
  Share2,
  Star,
  Sun,
  Users,
  Video,
  Wifi,
  type LucideIcon,
} from "lucide-react";

interface IconDefinition {
  label: string;
  icon: LucideIcon;
}

export const ICONS = {
  bible: { label: "Bible", icon: BookOpenText },
  book: { label: "Open book", icon: BookOpen },
  cross: { label: "Cross", icon: Cross },
  church: { label: "Church", icon: Church },
  megaphone: { label: "Megaphone", icon: Megaphone },
  bell: { label: "Bell", icon: Bell },
  camera: { label: "Camera", icon: Video },
  live: { label: "Live", icon: Radio },
  microphone: { label: "Microphone", icon: Mic },
  music: { label: "Music", icon: Music },
  prayer: { label: "Prayer", icon: HandHeart },
  heart: { label: "Heart", icon: Heart },
  giving: { label: "Giving", icon: HandCoins },
  gift: { label: "Gift", icon: Gift },
  calendar: { label: "Calendar", icon: Calendar },
  clock: { label: "Time", icon: Clock },
  location: { label: "Location", icon: MapPin },
  phone: { label: "Phone", icon: Phone },
  email: { label: "Email", icon: Mail },
  website: { label: "Website", icon: Globe },
  people: { label: "People", icon: Users },
  chat: { label: "Chat", icon: MessageCircle },
  share: { label: "Share", icon: Share2 },
  wifi: { label: "WiFi", icon: Wifi },
  children: { label: "Children", icon: Baby },
  fire: { label: "Fire", icon: Flame },
  sun: { label: "Sun", icon: Sun },
  star: { label: "Star", icon: Star },
  info: { label: "Info", icon: Info },
  quote: { label: "Quote", icon: Quote },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

export const ICON_ORDER = Object.keys(ICONS) as IconName[];

export const DEFAULT_ICON: IconName = "bible";

export const isIconName = (name: string): name is IconName =>
  Object.prototype.hasOwnProperty.call(ICONS, name);

export const iconDefinition = (name: string): IconDefinition =>
  ICONS[isIconName(name) ? name : DEFAULT_ICON];
