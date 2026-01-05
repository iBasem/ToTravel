
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Heart, 
  Star, 
  MapPin, 
  Clock,
  Trash2,
  Share2
} from "lucide-react";

const wishlistItems = [
  {
    id: 1,
    title: "Iceland Northern Lights",
    duration: "6 days",
    rating: 4.9,
    reviews: 15,
    originalPrice: 2200,
    currentPrice: 1980,
    discount: 10,
    destination: "Iceland",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop",
    addedDate: "2024-01-15"
  },
  {
    id: 2,
    title: "Morocco Desert Experience",
    duration: "8 days",
    rating: 4.7,
    reviews: 42,
    originalPrice: 1650,
    currentPrice: 1485,
    discount: 10,
    destination: "Morocco",
    image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?w=400&h=300&fit=crop",
    addedDate: "2024-01-20"
  },
  {
    id: 3,
    title: "Japan Cherry Blossom",
    duration: "10 days",
    rating: 4.8,
    reviews: 88,
    originalPrice: 3200,
    currentPrice: 2880,
    discount: 10,
    destination: "Japan",
    image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop",
    addedDate: "2024-02-01"
  },
  {
    id: 4,
    title: "Patagonia Trekking",
    duration: "12 days",
    rating: 4.6,
    reviews: 33,
    originalPrice: 2800,
    currentPrice: 2520,
    discount: 10,
    destination: "Argentina & Chile",
    image: "https://images.unsplash.com/photo-1551524164-d526dfc8de27?w=400&h=300&fit=crop",
    addedDate: "2024-02-10"
  }
];

export default function TravelerWishlist() {
  const [items, setItems] = useState(wishlistItems);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const removeFromWishlist = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const shareWishlistItem = (item: any) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this amazing tour: ${item.title}`,
        url: window.location.origin + `/dashboard/packages/${item.id}`,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/dashboard/packages/${item.id}`);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myWishlist')}</h1>
          <p className="text-gray-600">{items.length} {t('travelerDashboard.toursSavedForLater')}</p>
        </div>
        <Button variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Share2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('travelerDashboard.shareWishlist')}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('travelerDashboard.wishlistEmpty')}</h3>
          <p className="text-gray-600 mb-6">{t('travelerDashboard.startExploring')}</p>
          <Link to="/">
            <Button>{t('travelerDashboard.browseTours')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  {item.discount > 0 && (
                    <Badge className={`absolute top-2 bg-red-500 text-white ${isRTL ? 'right-2' : 'left-2'}`}>
                      -{item.discount}% {t('common.off')}
                    </Badge>
                  )}
                  <div className={`absolute top-2 flex gap-2 ${isRTL ? 'left-2' : 'right-2'}`}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="bg-white/80 hover:bg-white"
                      onClick={() => shareWishlistItem(item)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : ''}`}>{item.title}</h3>
                  <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{item.destination}</span>
                    <span className="text-sm text-gray-600">• {item.duration}</span>
                  </div>
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium tabular-nums">{item.rating}</span>
                      <span className="text-sm text-gray-500">({item.reviews})</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-left' : ''}>
                      {item.discount > 0 && (
                        <span className={`text-sm text-gray-500 line-through ${isRTL ? 'ml-2' : 'mr-2'}`}>
                          ${item.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900 tabular-nums">
                        ${item.currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/dashboard/packages/${item.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        {t('common.viewDetails')}
                      </Button>
                    </Link>
                  </div>
                  <p className={`text-xs text-gray-500 mt-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('common.added')} {new Date(item.addedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
