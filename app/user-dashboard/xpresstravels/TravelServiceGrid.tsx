import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, Plane, Calendar, MapPin } from 'lucide-react';

interface TravelService {
  name: string;
  website: string;
  color: string;
  logoFallback: string;
  logoPath?: string; // Optional path to local image
}

interface MetaSearchEngine {
  name: string;
  website: string;
  color: string;
  icon: React.ReactNode;
  logoPath?: string; // Added logoPath for image
  logoFallback: string; // Added logoFallback for text fallback
  description: string;
}

const metaSearchEngines: MetaSearchEngine[] = [
  {
    name: 'KAYAK',
    website: 'https://www.kayak.com/',
    color: '#FF690F',
    icon: <Plane className="h-10 w-10 text-white" />,
    logoPath: '/images/kayak.png', // Path to local image in public folder
    logoFallback: 'KY',
    description: 'Compare hundreds of travel sites at once'
  },
  {
    name: 'Skyscanner',
    website: 'https://www.skyscanner.com/',
    color: '#0770E3',
    icon: <Plane className="h-10 w-10 text-white" />,
    logoPath: '/images/skyscanner.png', // Path to local image in public folder
    logoFallback: 'SS',
    description: 'Find the best flight, hotel and car rental deals'
  },
  {
    name: 'Google Flights',
    website: 'https://www.google.com/travel/flights',
    color: '#4285F4',
    icon: <Plane className="h-10 w-10 text-white" />,
    logoPath: '/images/googleflights.png', // Path to local image in public folder
    logoFallback: 'GF',
    description: 'Search across travel providers to find the best flights'
  }
];

const travelServices: TravelService[] = [
  {
    name: '12go',
    website: 'https://12go.asia/',
    color: '#ffffff',
    logoFallback: '12',
    logoPath: '/images/12go.png'
  },
  {
    name: '2GoTravel',
    website: 'https://travel.2go.com.ph/',
    color: '#ffffff',
    logoFallback: '2G',
    logoPath: '/images/2gotravel.png'
  },
  {
    name: 'Agoda',
    website: 'https://www.agoda.com/',
    color: '#ffffff',
    logoFallback: 'AG',
    logoPath: '/images/agoda.png'
  },
  {
    name: 'AirAsia',
    website: 'https://www.airasia.com/',
    color: '#ffffff',
    logoFallback: 'AA',
    logoPath: '/images/airasia.png'
  },
  {
    name: 'Airpaz',
    website: 'https://www.airpaz.com/',
    color: '#ffffff',
    logoFallback: 'AP',
    logoPath: '/images/airpaz.png'
  },
  {
    name: 'Cebu Pacific',
    website: 'https://www.cebupacificair.com/',
    color: '#ffffff',
    logoFallback: 'CP',
    logoPath: '/images/cebupacific.png'
  },
  {
    name: 'Kiwi',
    website: 'https://www.kiwi.com/',
    color: '#ffffff',
    logoFallback: 'KW',
    logoPath: '/images/kiwi.jpeg'
  },
  {
    name: 'ly.com',
    website: 'https://www.ly.com/',
    color: '#ffffff',
    logoFallback: 'LY',
    logoPath: '/images/ly.jpg'
  },
  {
    name: 'PAL',
    website: 'https://www.philippineairlines.com/',
    color: '#ffffff',
    logoFallback: 'PA',
    logoPath: '/images/PAL.png'
  },
  {
    name: 'Traveloka',
    website: 'https://www.traveloka.com/',
    color: '#ffffff',
    logoFallback: 'TV',
    logoPath: '/images/traveloka.png'
  },
  {
    name: 'Trip',
    website: 'https://www.trip.com/',
    color: '#ffffff',
    logoFallback: 'TR',
    logoPath: '/images/trip.png'
  }
];

const TravelServiceGrid: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState<TravelService[]>(travelServices);
  const [showNoResults, setShowNoResults] = useState(false);

  // Filter travel services based on search query
  useEffect(() => {
    const search = searchQuery.toLowerCase().trim();
    if (search === '') {
      setFilteredServices(travelServices);
      setShowNoResults(false);
    } else {
      const filtered = travelServices.filter(service =>
        service.name.toLowerCase().includes(search)
      );
      setFilteredServices(filtered);
      setShowNoResults(filtered.length === 0);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect above
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-full">
      {/* Search Meta Engine */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">Find Your Perfect Travel Deal</h2>
          <form onSubmit={handleSearch} className="flex items-center max-w-xl mx-auto bg-white rounded-full overflow-hidden border border-gray-300">
            <Search className="ml-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search travel service providers..."
              className="flex-grow p-3 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none">Search</Button>
          </form>
        </div>

        {/* Meta Search Engines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metaSearchEngines.map((engine) => (
            <Card key={engine.name} className="hover:shadow-lg transition-shadow w-full">
              <CardContent className="p-4">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 min-w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: engine.color }}>
                    {engine.logoPath ? (
                      <img
                        src={engine.logoPath}
                        alt={`${engine.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fall back to icon if image fails to load
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`fallback-icon ${engine.logoPath ? 'hidden' : ''}`}>
                      {engine.icon}
                    </div>
                  </div>
                  <div className="ml-4 overflow-hidden">
                    <h3 className="text-lg font-bold truncate">{engine.name}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{engine.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                    <Plane className="h-3 w-3 mr-1" />
                    <span>Flights</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Hotels</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>Packages</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-2 bg-gray-50 border-t">
                <Button
                  className="w-full text-xs"
                  style={{ backgroundColor: engine.color }}
                  onClick={() => window.open(engine.website, '_blank')}
                >
                  <span className="truncate">Visit {engine.name}</span> <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Travel Service Grid */}
      <div className="w-full overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Travel Service Providers</h2>

        {showNoResults ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No travel services found matching "{searchQuery}"</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredServices.map((service) => (
              <Card key={service.name} className="flex flex-col border border-gray-200 overflow-hidden hover:shadow-md transition-shadow w-full">
                <CardContent className="flex flex-col items-center justify-center p-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: service.color }}>
                    {service.logoPath ? (
                      <img
                        src={service.logoPath}
                        alt={`${service.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fall back to text if image fails to load
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-white font-bold fallback-text ${service.logoPath ? 'hidden' : ''}`}>
                      {service.logoFallback}
                    </span>
                  </div>
                  <h3 className="mt-2 text-center text-xs font-medium truncate max-w-full px-1">{service.name}</h3>
                </CardContent>
                <CardFooter className="p-2 bg-gray-50 mt-auto">
                  <Button
                    className="w-full text-xs py-1 bg-blue-500 hover:bg-blue-600"
                    size="sm"
                    onClick={() => window.open(service.website, '_blank')}
                  >
                    <span className="sr-only">Visit {service.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelServiceGrid;