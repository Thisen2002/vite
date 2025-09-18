// Building API service for connecting to the building service
// This service handles all communication with the building service backend

const BUILDING_SERVICE_URL = import.meta.env.VITE_BUILDING_API_URL || import.meta.env.VITE_MAIN_API_URL || 'http://localhost:5000'; // Building service port

class BuildingApiService {
  constructor() {
    this.baseUrl = BUILDING_SERVICE_URL;
  }

  // Get all buildings
  async getAllBuildings() {
    try {
      const response = await fetch(`${this.baseUrl}/buildings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`fetched data:${data}`)
      return data;
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }

  // Get building by ID
  async getBuildingById(buildingId) {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching building by ID:', error);
      throw error;
    }
  }

  // Create new building
  async createBuilding(buildingData) {
    try {
      const response = await fetch(`${this.baseUrl}/buildings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildingData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating building:', error);
      throw error;
    }
  }

  // Update building
  async updateBuilding(buildingId, buildingData) {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildingData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating building:', error);
      throw error;
    }
  }

  // Delete building
  async deleteBuilding(buildingId) {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting building:', error);
      throw error;
    }
  }

  // Search buildings by name or description
  async searchBuildings(query) {
    try {
      const allBuildings = await this.getAllBuildings();
      const filteredBuildings = allBuildings.filter(building => 
        building.building_name.toLowerCase().includes(query.toLowerCase()) ||
        (building.description && building.description.toLowerCase().includes(query.toLowerCase()))
      );
      return filteredBuildings;
    } catch (error) {
      console.error('Error searching buildings:', error);
      throw error;
    }
  }

  // Get buildings by zone
  async getBuildingsByZone(zoneId) {
    try {
      const allBuildings = await this.getAllBuildings();
      const zoneBuildings = allBuildings.filter(building => 
        building.zone_id === parseInt(zoneId)
      );
      return zoneBuildings;
    } catch (error) {
      console.error('Error fetching buildings by zone:', error);
      throw error;
    }
  }

  // Transform building data for map display
  transformBuildingForMap(building) {
    return {
      id: building.building_id,
      name: building.building_name,
      description: building.description,
      zoneId: building.zone_id,
      exhibits: building.exhibits || [],
      // Add coordinates mapping if you have building coordinates
      // You might need to map building_id to actual map coordinates
      coordinates: this.getBuildingCoordinates(building.building_id),
      type: 'building',
      category: 'Building'
    };
  }

  // Map building IDs to coordinates (you'll need to customize this based on your map)
  getBuildingCoordinates(buildingId) {
    // This is a mapping function - you'll need to customize this based on your actual building positions
    const buildingCoordinates = {
      1: [7.253750, 80.592028], // Example coordinates
      2: [7.253800, 80.592100],
      3: [7.253850, 80.592150],
      // Add more mappings as needed
    };
    return buildingCoordinates[buildingId] || [7.253750, 80.592028]; // Default coordinates
  }

  // Search buildings by name, description, and exhibits
  async searchBuildings(query, options = {}) {
    try {
      if (!query || query.trim() === '') return [];
      
      const searchTerm = query.trim().toLowerCase();
      
      // Get all buildings first
      const allBuildings = await this.getAllBuildings();
      
      let results = [];
      
      // Search through ALL buildings - include all buildings in search results
      allBuildings.forEach((building) => {
        const svgId = this.mapDatabaseIdToSvgId(building.building_id);
        
        const matchesQuery = 
          building.building_name?.toLowerCase().includes(searchTerm) ||
          building.description?.toLowerCase().includes(searchTerm) ||
          building.exhibits?.some(exhibit => exhibit.toLowerCase().includes(searchTerm));
        
        if (matchesQuery) {
          // Check zone filter if provided
          if (options.zone && options.zone !== 'all') {
            if (building.zone_id !== parseInt(options.zone)) return;
          }
          
          // Add building to results
          results.push({
            id: building.building_id,
            name: building.building_name,
            category: 'Building',
            description: building.description,
            buildingId: building.building_id,
            svgBuildingId: svgId, // This will be "b5" for Common Room
            zoneId: building.zone_id,
            exhibits: building.exhibits || [],
            type: 'building'
          });
          
          // Add exhibits from this building that match the search
          if (building.exhibits) {
            building.exhibits.forEach((exhibit, index) => {
              if (exhibit.toLowerCase().includes(searchTerm)) {
                results.push({
                  id: `${building.building_id}-exhibit-${index}`,
                  name: exhibit,
                  category: 'Exhibit',
                  description: `Exhibit in ${building.building_name}`,
                  buildingId: building.building_id,
                  buildingName: building.building_name,
                  svgBuildingId: svgId,
                  zoneId: building.zone_id,
                  type: 'exhibit'
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
      
      return uniqueResults.slice(0, 10); // Limit to 10 results for better UX
      
    } catch (error) {
      console.error('Error searching buildings:', error);
      throw error;
    }
  }

  // Map database building ID to SVG building ID (b1, b2, etc.)
  mapDatabaseIdToSvgId(databaseId) {
    const mapping = {
      1: "b1",   // Engineering Hall
      2: "b2",   // Science Center
      3: "b3",   // Innovation Hub
      4: "b4",   // Cultural Pavilion
      5: "b5",   // Common Room
      // Add more mappings as needed
    };
    return mapping[databaseId] || `b${databaseId}`;
  }

  // Check if a building has a valid SVG mapping (exists on the map)
  isValidSvgMapping(databaseId) {
    const validMappings = {
      1: "b1",   // Engineering Hall
      2: "b2",   // Science Center
      3: "b3",   // Innovation Hub
      4: "b4",   // Cultural Pavilion
      5: "b5",   // Common Room
      // Add more mappings as needed
    };
    return validMappings.hasOwnProperty(databaseId);
  }
}

// Create and export a singleton instance
const buildingApiService = new BuildingApiService();
export default buildingApiService;
