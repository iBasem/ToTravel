export interface RouteDestination {
  id: string;
  name: string;
  nameAr?: string;
  latitude: number;
  longitude: number;
  order: number;
  type: 'origin' | 'stop' | 'destination';
  daysSpent: number;
  placeId?: string;
}

export interface RouteData {
  destinations: RouteDestination[];
  travelMode: 'driving' | 'walking' | 'cycling';
  showDistances: boolean;
}

export const defaultRouteData: RouteData = {
  destinations: [],
  travelMode: 'driving',
  showDistances: true
};
