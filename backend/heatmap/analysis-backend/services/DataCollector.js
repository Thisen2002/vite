/**
 * Data Collector Service
 * 
 * Handles collection of crowd data from various sources:
 * 1. Real API endpoints (when available)
 * 2. Mock data generation (for development/testing)
 * 3. Data validation and preprocessing
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

const axios = require('axios');

class DataCollector {
  constructor(mockMode = true) {
    this.mockMode = mockMode;
    this.realApiEndpoint = process.env.REAL_API_ENDPOINT || 'http://localhost:3000/api/crowd-data';
    this.mockBaseValues = new Map(); // buildingId -> base crowd level for realistic mock data
    this.timePatterns = new Map(); // buildingId -> usage patterns
    this.lastCollectionTime = null;
    
    console.log(`📡 DataCollector initialized (${mockMode ? 'MOCK' : 'REAL'} mode)`);
  }
  
  /**
   * Initialize mock data patterns for buildings
   * 
   * @param {Array} buildings - Array of building configurations
   */
  initializeMockPatterns(buildings) {
    console.log('🎭 Initializing mock data patterns...');
    
    buildings.forEach(building => {
      // Set realistic base occupancy levels
      const baseOccupancy = this.calculateBaseOccupancy(building);
      this.mockBaseValues.set(building.id, baseOccupancy);
      
      // Create time-based usage patterns
      const pattern = this.createUsagePattern(building);
      this.timePatterns.set(building.id, pattern);
      
      console.log(`📊 Mock pattern for ${building.name}: base=${baseOccupancy}, type=${building.type}`);
    });
  }
  
  /**
   * Calculate realistic base occupancy for a building
   * 
   * @param {Object} building - Building configuration
   * @returns {number} Base occupancy level
   */
  calculateBaseOccupancy(building) {
    const { type, capacity } = building;
    
    // Base occupancy percentages by building type
    const baseOccupancyRates = {
      'lecture': 0.15,       // 15% - between classes
      'lecture_hall': 0.12,  // 12% - larger halls less occupied when empty
      'lab': 0.25,           // 25% - often has ongoing work
      'computer_lab': 0.20,  // 20% - students working on projects
      'library': 0.40,       // 40% - steady study usage
      'study_area': 0.35,    // 35% - consistent study usage
      'cafeteria': 0.10,     // 10% - empty between meal times
      'dining': 0.08,        // 8% - very low between meals
      'auditorium': 0.05,    // 5% - mostly empty unless events
      'hall': 0.05,          // 5% - event-based usage
      'default': 0.20        // 20% - generic base rate
    };
    
    const rate = baseOccupancyRates[type?.toLowerCase()] || baseOccupancyRates.default;
    return Math.round(capacity * rate);
  }
  
  /**
   * Create usage pattern for a building type
   * 
   * @param {Object} building - Building configuration
   * @returns {Object} Usage pattern configuration
   */
  createUsagePattern(building) {
    const { type } = building;
    
    switch (type?.toLowerCase()) {
      case 'lecture':
      case 'lecture_hall':
        return {
          type: 'scheduled',
          peaks: [
            { hour: 8, intensity: 0.8 },   // 8 AM class
            { hour: 10, intensity: 0.9 },  // 10 AM peak
            { hour: 14, intensity: 0.8 },  // 2 PM class
            { hour: 16, intensity: 0.7 }   // 4 PM class
          ],
          duration: 90, // 90 minutes per session
          baseline: 0.1
        };
        
      case 'lab':
      case 'computer_lab':
        return {
          type: 'gradual',
          peaks: [
            { hour: 10, intensity: 0.6 },  // Morning sessions
            { hour: 14, intensity: 0.8 },  // Afternoon peak
            { hour: 18, intensity: 0.5 }   // Evening work
          ],
          duration: 180, // 3 hours sessions
          baseline: 0.25
        };
        
      case 'library':
      case 'study_area':
        return {
          type: 'steady',
          peaks: [
            { hour: 9, intensity: 0.5 },   // Morning study
            { hour: 14, intensity: 0.7 },  // Afternoon peak
            { hour: 19, intensity: 0.9 }   // Evening study peak
          ],
          duration: 240, // 4 hours study sessions
          baseline: 0.4
        };
        
      case 'cafeteria':
      case 'dining':
        return {
          type: 'meal_based',
          peaks: [
            { hour: 8, intensity: 0.6 },   // Breakfast
            { hour: 12, intensity: 1.0 },  // Lunch peak
            { hour: 18, intensity: 0.8 }   // Dinner
          ],
          duration: 60, // 1 hour meal periods
          baseline: 0.05
        };
        
      case 'auditorium':
      case 'hall':
        return {
          type: 'event_based',
          peaks: [
            { hour: 11, intensity: 0.3 },  // Occasional morning events
            { hour: 15, intensity: 0.5 }   // Afternoon events
          ],
          duration: 120, // 2 hours events
          baseline: 0.02
        };
        
      default:
        return {
          type: 'general',
          peaks: [
            { hour: 10, intensity: 0.6 },
            { hour: 15, intensity: 0.7 }
          ],
          duration: 120,
          baseline: 0.2
        };
    }
  }
  
  /**
   * Collect crowd data for all buildings
   * 
   * @param {Array} buildings - Array of building configurations
   * @returns {Array} Array of crowd observations
   */
  async collectData(buildings) {
    this.lastCollectionTime = new Date();
    
    if (this.mockMode) {
      return this.generateMockData(buildings);
    } else {
      return this.collectRealData(buildings);
    }
  }
  
  /**
   * Collect data from real API endpoint
   * 
   * @param {Array} buildings - Array of building configurations
   * @returns {Array} Real crowd data
   */
  async collectRealData(buildings) {
    try {
      console.log('📡 Collecting real crowd data...');
      
      const response = await axios.get(this.realApiEndpoint, {
        timeout: 5000,
        params: {
          buildings: buildings.map(b => b.id).join(',')
        }
      });
      
      const realData = response.data;
      console.log(`✅ Collected real data for ${realData.length} buildings`);
      
      // Validate and normalize real data
      return this.validateAndNormalizeData(realData, buildings);
      
    } catch (error) {
      console.error(`❌ Failed to collect real data: ${error.message}`);
      console.log('🎭 Falling back to mock data...');
      
      // Fallback to mock data if real API fails
      return this.generateMockData(buildings);
    }
  }
  
  /**
   * Generate realistic mock crowd data
   * 
   * @param {Array} buildings - Array of building configurations
   * @returns {Array} Mock crowd observations
   */
  generateMockData(buildings) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    console.log(`🎭 Generating mock data for ${buildings.length} buildings at ${hour}:${minute.toString().padStart(2, '0')}`);
    
    const observations = buildings.map(building => {
      const baseValue = this.mockBaseValues.get(building.id) || 0;
      const pattern = this.timePatterns.get(building.id);
      const mockCount = this.generateBuildingMockData(building, baseValue, pattern, hour, minute, dayOfWeek);
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        crowdCount: mockCount,
        timestamp: now,
        source: 'mock',
        capacity: building.capacity,
        occupancyRate: mockCount / building.capacity
      };
    });
    
    console.log(`📊 Generated mock data: avg=${Math.round(observations.reduce((sum, obs) => sum + obs.crowdCount, 0) / observations.length)} people`);
    
    return observations;
  }
  
  /**
   * Generate mock data for a single building
   * 
   * @param {Object} building - Building configuration
   * @param {number} baseValue - Base occupancy
   * @param {Object} pattern - Usage pattern
   * @param {number} hour - Current hour
   * @param {number} minute - Current minute
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {number} Mock crowd count
   */
  generateBuildingMockData(building, baseValue, pattern, hour, minute, dayOfWeek) {
    // Weekend adjustment (reduce activity on weekends)
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1.0;
    
    // Calculate time-based multiplier
    let timeMultiplier = pattern.baseline;
    
    // Check if we're near any peak times
    pattern.peaks.forEach(peak => {
      const timeDiff = Math.abs(hour - peak.hour);
      const peakDuration = pattern.duration / 60; // Convert minutes to hours
      
      if (timeDiff <= peakDuration / 2) {
        // We're within the peak period
        const peakProgress = 1 - (timeDiff / (peakDuration / 2));
        const peakContribution = peak.intensity * peakProgress;
        timeMultiplier = Math.max(timeMultiplier, peakContribution);
      }
    });
    
    // Apply weekend factor
    timeMultiplier *= weekendFactor;
    
    // Calculate base crowd level
    const targetCrowd = baseValue + (building.capacity * timeMultiplier);
    
    // Add realistic random variation (±15%)
    const variation = 0.15;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
    
    // Add small trend component (simulates gradual changes)
    const trendFactor = 1 + (Math.sin(Date.now() / 600000) * 0.1); // 10-minute cycle
    
    // Calculate final count
    let finalCount = Math.round(targetCrowd * randomFactor * trendFactor);
    
    // Ensure within reasonable bounds
    finalCount = Math.max(0, Math.min(building.capacity, finalCount));
    
    return finalCount;
  }
  
  /**
   * Validate and normalize data from real API
   * 
   * @param {Array} rawData - Raw data from API
   * @param {Array} buildings - Building configurations
   * @returns {Array} Validated and normalized data
   */
  validateAndNormalizeData(rawData, buildings) {
    const buildingMap = new Map(buildings.map(b => [b.id, b]));
    const validatedData = [];
    
    rawData.forEach(dataPoint => {
      const building = buildingMap.get(dataPoint.buildingId);
      
      if (!building) {
        console.warn(`⚠️ Unknown building in real data: ${dataPoint.buildingId}`);
        return;
      }
      
      // Validate crowd count
      let crowdCount = parseInt(dataPoint.crowdCount);
      if (isNaN(crowdCount) || crowdCount < 0) {
        console.warn(`⚠️ Invalid crowd count for ${building.name}: ${dataPoint.crowdCount}`);
        crowdCount = 0;
      }
      
      // Apply capacity constraints
      if (crowdCount > building.capacity) {
        console.warn(`⚠️ Crowd count exceeds capacity for ${building.name}: ${crowdCount} > ${building.capacity}`);
        crowdCount = building.capacity;
      }
      
      validatedData.push({
        buildingId: building.id,
        buildingName: building.name,
        crowdCount: crowdCount,
        timestamp: new Date(dataPoint.timestamp || Date.now()),
        source: 'real_api',
        capacity: building.capacity,
        occupancyRate: crowdCount / building.capacity
      });
    });
    
    console.log(`✅ Validated ${validatedData.length}/${rawData.length} data points`);
    return validatedData;
  }
  
  /**
   * Switch between mock and real data modes
   * 
   * @param {boolean} mockMode - Whether to use mock mode
   */
  setMockMode(mockMode) {
    console.log(`🔄 Switching to ${mockMode ? 'MOCK' : 'REAL'} data mode`);
    this.mockMode = mockMode;
  }
  
  /**
   * Get collector status and statistics
   * 
   * @returns {Object} Collector status
   */
  getStatus() {
    return {
      mode: this.mockMode ? 'mock' : 'real',
      realApiEndpoint: this.realApiEndpoint,
      lastCollectionTime: this.lastCollectionTime,
      mockPatternsInitialized: this.mockBaseValues.size,
      status: this.mockMode ? 'active (mock)' : 'active (real API)'
    };
  }
  
  /**
   * Test connection to real API
   * 
   * @returns {Object} Connection test result
   */
  async testRealApiConnection() {
    try {
      const response = await axios.get(this.realApiEndpoint, {
        timeout: 3000,
        params: { test: 'connection' }
      });
      
      return {
        success: true,
        status: response.status,
        message: 'Real API connection successful',
        endpoint: this.realApiEndpoint
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Real API connection failed',
        endpoint: this.realApiEndpoint
      };
    }
  }
  
  /**
   * Get mock data preview for debugging
   * 
   * @param {Array} buildings - Building configurations (first 3)
   * @returns {Object} Mock data preview
   */
  getMockDataPreview(buildings) {
    const previewBuildings = buildings.slice(0, 3); // First 3 buildings
    const mockData = this.generateMockData(previewBuildings);
    
    return {
      timestamp: new Date(),
      sampleData: mockData,
      patterns: previewBuildings.map(building => ({
        buildingId: building.id,
        buildingName: building.name,
        baseValue: this.mockBaseValues.get(building.id),
        pattern: this.timePatterns.get(building.id)
      }))
    };
  }
}

module.exports = DataCollector;