// search.js
// Function to search data from the backend database

// Search function for the backend
function searchDatabase(query, { category, zone, subzone } = {}) {
  if (!query || query.trim() === '') return [];
  
  const searchTerm = query.trim().toLowerCase();
  let results = [];
  
  // For now, return mock results since we don't have buildingData.js in this backend
  // This should be replaced with actual database queries
  const mockBuildings = [
    {
      id: '1',
      name: 'Main Exhibition Hall',
      description: 'Main exhibition area with various displays',
      categories: ['Exhibits'],
      exhibits: ['Robotics Display', 'AI Technology', 'Space Technology'],
      amenities: ['Restrooms', 'Information Desk'],
      coordinates: [7.253750, 80.592028]
    },
    {
      id: '2', 
      name: 'Engineering Pavilion',
      description: 'Engineering and technology exhibits',
      categories: ['Exhibits', 'Amenities'],
      exhibits: ['Civil Engineering', 'Mechanical Engineering'],
      amenities: ['Food Court', 'Rest Area'],
      coordinates: [7.253800, 80.592100]
    }
  ];
  
  // Search in mock buildings
  mockBuildings.forEach((building) => {
    const matchesQuery = 
      building.name?.toLowerCase().includes(searchTerm) ||
      building.description?.toLowerCase().includes(searchTerm) ||
      building.exhibits?.some(exhibit => exhibit.toLowerCase().includes(searchTerm)) ||
      building.amenities?.some(amenity => amenity.toLowerCase().includes(searchTerm)) ||
      building.categories?.some(cat => cat.toLowerCase().includes(searchTerm));
    
    if (matchesQuery) {
      // Check category filter
      if (category && category !== 'all') {
        const hasCategory = building.categories?.includes(category);
        if (!hasCategory) return;
      }
      
      // Add building to results
      results.push({
        id: building.id,
        name: building.name,
        category: 'Building',
        description: building.description,
        buildingId: building.id,
        svgBuildingId: `b${building.id}`,
        coordinates: building.coordinates,
        type: 'building'
      });
      
      // Add exhibits from this building
      if (building.exhibits) {
        building.exhibits.forEach((exhibit, index) => {
          if (exhibit.toLowerCase().includes(searchTerm)) {
            results.push({
              id: `${building.id}-exhibit-${index}`,
              name: exhibit,
              category: 'Exhibit',
              description: '',
              buildingId: building.id,
              buildingName: building.name,
              svgBuildingId: `b${building.id}`,
              coordinates: building.coordinates,
              type: 'exhibit'
            });
          }
        });
      }
      
      // Add amenities from this building
      if (building.amenities) {
        building.amenities.forEach((amenity, index) => {
          if (amenity.toLowerCase().includes(searchTerm)) {
            results.push({
              id: `${building.id}-amenity-${index}`,
              name: amenity,
              category: 'Amenity',
              description: '',
              buildingId: building.id,
              buildingName: building.name,
              svgBuildingId: `b${building.id}`,
              coordinates: building.coordinates,
              type: 'amenity'
            });
          }
        });
      }
    }
  });
  
  // Remove duplicates and limit results
  const uniqueResults = results.filter((result, index, self) => 
    index === self.findIndex(r => r.id === result.id)
  );
  
  return uniqueResults.slice(0, 20); // Limit to 20 results
}

module.exports = {
  searchDatabase
};

