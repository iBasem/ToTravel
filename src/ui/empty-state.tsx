
import { Package, Calendar, Users, Star, Image, MessageSquare, Tag, ChartBar, MapPin, Search } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  package: Package,
  calendar: Calendar,
  users: Users,
  star: Star,
  image: Image,
  "message-square": MessageSquare,
  tag: Tag,
  "chart-bar": ChartBar,
  "map-pin": MapPin,
  search: Search,
};

export function EmptyState({ icon, title, description, className = "", action }: EmptyStateProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Package;

  return (
    <div className={`text-center py-8 sm:py-12 ${className}`}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" />
      </div>
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-md mx-auto mb-4">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="text-xs sm:text-sm lg:text-base">
          {action.label}
        </Button>
      )}
    </div>
  );
}
