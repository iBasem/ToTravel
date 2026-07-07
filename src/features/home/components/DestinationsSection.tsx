import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/ui/card";

export function DestinationsSection() {
  const { t } = useTranslation();

  const destinationCards = [
    {
      id: 1,
      title: t('destinations.europe'),
      subtitle: t('destinations.culturalJourneys'),
      image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop",
      color: "bg-green-50 dark:bg-green-900/30"
    },
    {
      id: 2,
      title: t('destinations.asia'),
      subtitle: t('destinations.adventureTours'),
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      color: "bg-orange-50 dark:bg-orange-900/30"
    },
    {
      id: 3,
      title: t('destinations.americas'),
      subtitle: t('destinations.wildExpeditions'),
      image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=400&h=300&fit=crop",
      color: "bg-red-50 dark:bg-red-900/30"
    },
    {
      id: 4,
      title: t('destinations.africa'),
      subtitle: t('destinations.safariAdventures'),
      image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop",
      color: "bg-yellow-50 dark:bg-yellow-900/30"
    },
    {
      id: 5,
      title: t('destinations.oceania'),
      subtitle: t('destinations.islandEscapes'),
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      color: "bg-blue-50 dark:bg-blue-900/30"
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{t('destinations.title')}</h2>
        <p className="text-muted-foreground">{t('destinations.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {destinationCards.map((destination) => (
          <Link key={destination.id} to="/destinations">
            <Card className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${destination.color}`}>
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={destination.image}
                    alt={destination.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold">{destination.title}</h3>
                  <p className="text-sm text-muted-foreground">{destination.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
