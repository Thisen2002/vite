import { useState, useEffect } from 'react'

interface Exhibit {
  exhibit_id: string;
  exhibit_name: string;
  location: string;
  building_name: string;
  tag: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ExhibitsPageTailwindProps {}

const ExhibitsPageTailwind: React.FC<ExhibitsPageTailwindProps> = () => {
  // State management
  const [allExhibits, setAllExhibits] = useState<Exhibit[]>([]) // All exhibits
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>('') // Empty for all
  const [searchQuery, setSearchQuery] = useState<string>('') // Search input
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false) // Dropdown state
  
  // Hardcoded tags
  const tags: string[] = [
    'AI', 'ICT', 'Structures', 'Mechanical', 'Neural Networks', 
    'Power', 'Automation', 'Robotics', 'Electronics', 'Software'
  ]

  // Color mapping for different tag categories
  const getTagColor = (tag: string): { bg: string; text: string; border: string } => {
    const colors = {
      'AI': { bg: '#2e3576ff', text: '#FFFFFF', border: '#3b4a8a' }, // Dark Blue
      'ICT': { bg: '#3b82f6ff', text: '#FFFFFF', border: '#60A5FA' }, // Blue
      'Structures': { bg: '#F59E0B', text: '#FFFFFF', border: '#FBBF24' }, // Amber
      'Mechanical': { bg: '#EF4444', text: '#FFFFFF', border: '#F87171' }, // Red
      'Neural Networks': { bg: '#EC4899', text: '#FFFFFF', border: '#F472B6' }, // Pink
      'Power': { bg: '#10B981', text: '#FFFFFF', border: '#34D399' }, // Emerald
      'Automation': { bg: '#06B6D4', text: '#FFFFFF', border: '#22D3EE' }, // Cyan
      'Robotics': { bg: '#8B5CF6', text: '#FFFFFF', border: '#A78BFA' }, // Purple
      'Electronics': { bg: '#F97316', text: '#FFFFFF', border: '#FB923C' }, // Orange
      'Software': { bg: '#6366F1', text: '#FFFFFF', border: '#818CF8' }, // Indigo
    }
    return colors[tag as keyof typeof colors] || { bg: '#6B7280', text: '#FFFFFF', border: '#9CA3AF' } // Default gray
  }

  // Hardcoded exhibits data
  useEffect(() => {
    const hardcodedExhibits: Exhibit[] = [
      {
        exhibit_id: '1',
        exhibit_name: 'AI Vision System',
        location: 'Main Hall A',
        building_name: 'Tech Pavilion',
        tag: 'AI'
      },
      {
        exhibit_id: '2',
        exhibit_name: '5G Network Demo',
        location: 'Exhibit Hall B',
        building_name: 'Innovation Center',
        tag: 'ICT'
      },
      {
        exhibit_id: '3',
        exhibit_name: 'Smart Bridge Model',
        location: 'Outdoor Plaza',
        building_name: 'Engineering Zone',
        tag: 'Structures'
      },
      {
        exhibit_id: '4',
        exhibit_name: 'Hydraulic Arm',
        location: 'Demo Area C',
        building_name: 'Mechanics Hall',
        tag: 'Mechanical'
      },
      {
        exhibit_id: '5',
        exhibit_name: 'Neural Net Simulator',
        location: 'Lab 1',
        building_name: 'Research Wing',
        tag: 'Neural Networks'
      },
      {
        exhibit_id: '6',
        exhibit_name: 'Solar Power Station',
        location: 'Energy Zone D',
        building_name: 'Green Tech Building',
        tag: 'Power'
      },
      {
        exhibit_id: '7',
        exhibit_name: 'Automated Assembly Line',
        location: 'Factory Floor E',
        building_name: 'Industry 4.0 Hub',
        tag: 'Automation'
      },
      {
        exhibit_id: '8',
        exhibit_name: 'Robotic Arm Prototype',
        location: 'Tech Lab F',
        building_name: 'Robotics Center',
        tag: 'Robotics'
      },
      {
        exhibit_id: '9',
        exhibit_name: 'Circuit Board Showcase',
        location: 'Electronics Wing G',
        building_name: 'Tech Pavilion',
        tag: 'Electronics'
      },
      {
        exhibit_id: '10',
        exhibit_name: 'Code Compiler Demo',
        location: 'Software Lab H',
        building_name: 'Innovation Center',
        tag: 'Software'
      }
    ]

    setAllExhibits(hardcodedExhibits)
    setLoading(false)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Filter function based on selected tag and search query
  const getDisplayExhibits = (): Exhibit[] => {
    let filtered = allExhibits

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(exhibit => exhibit.tag === selectedTag)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exhibit => 
        exhibit.exhibit_name.toLowerCase().includes(query) ||
        exhibit.location.toLowerCase().includes(query) ||
        exhibit.building_name.toLowerCase().includes(query) ||
        exhibit.tag.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const displayExhibits = getDisplayExhibits()

  return (
    <div className="w-full h-full p-0 box-border overflow-visible animate-fadeIn">
      <div className="max-w-7xl mx-auto p-8 h-auto w-full">
        
        {/* Page Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl text-white mb-8 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            {selectedTag ? `${selectedTag} Exhibits` : 'All Exhibits'}
          </h1>
          
          {/* Description */}
          <p className="text-white/80 text-lg mb-6">
            Browse exhibits by category or search by name, location, or category
          </p>
          
          {/* Search Bar and Category Dropdown */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search exhibits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 backdrop-blur-md"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400/60 backdrop-blur-md transition-all duration-200 min-w-[200px] justify-between"
              >
                <span>{selectedTag || 'All Categories'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 border border-white/20 rounded-xl backdrop-blur-md shadow-xl z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedTag('')
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-white hover:bg-blue-500/20 hover:border-l-4 hover:border-blue-400 transition-all duration-200 cursor-pointer ${
                      selectedTag === '' ? 'bg-blue-500/30 border-l-4 border-blue-400' : ''
                    }`}
                  >
                    All Categories
                  </button>
                  {tags.map((tag) => {
                    const tagColors = getTagColor(tag)
                    const isActive = selectedTag === tag
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-white transition-all duration-200 cursor-pointer ${
                          isActive ? 'border-l-4' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? `${tagColors.bg}40` : 'transparent',
                          borderLeftColor: isActive ? tagColors.border : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = `${tagColors.bg}20`
                            e.currentTarget.style.borderLeft = `4px solid ${tagColors.border}`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.borderLeft = '4px solid transparent'
                          }
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tagColors.bg }}
                          ></span>
                          {tag}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exhibits Display Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {loading ? (
            <div className="text-center p-12 col-span-2">
              <p className="text-white text-xl">Loading exhibits...</p>
            </div>
          ) : error ? (
            <div className="text-center p-12 col-span-2">
              <p className="text-red-400 text-xl mb-4">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-blue-500/30 text-white rounded-xl border border-blue-400/60 hover:bg-blue-500/50 transition-all duration-300"
              >
                Retry
              </button>
            </div>
          ) : displayExhibits.length > 0 ? (
            displayExhibits.map((exhibit, index) => (
              <div 
                key={exhibit.exhibit_id || index} 
                className="bg-transparent backdrop-blur-xl rounded-2xl border-2 border-[rgba(59,130,246,0.6)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] animate-slideIn"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {/* Tag Badge */}
                <div 
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg border-2"
                  style={{ 
                    backgroundColor: getTagColor(exhibit.tag).bg,
                    borderColor: getTagColor(exhibit.tag).border,
                    color: getTagColor(exhibit.tag).text
                  }}
                >
                  <span>
                    {exhibit.tag.toUpperCase()}
                  </span>
                </div>
                
                {/* Exhibit Information */}
                <div className="mt-8 flex justify-between items-start flex-wrap gap-4">
                  <div className="mb-2 flex-1">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {exhibit.exhibit_name}
                    </h3>
                    <p className="text-blue-300 text-lg mb-2">
                      Building: {exhibit.building_name}
                    </p>
                  </div>
                  
                  {/* Location Container */}
                  <div className="flex gap-8 items-start"> 
                    <div className="flex flex-col gap-2 text-right min-w-[200px] items-end"> 
                      <span className="text-white/100 text-2xl font-medium block mb-1">Location</span>
                      <span className="text-[#FDE103] text-xl">
                        {exhibit.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-12 col-span-2">
              <div className="space-y-2">
                <p className="text-white/70 text-xl">No exhibits found{selectedTag ? ` for "${selectedTag}"` : ''}.</p>
                <p className="text-white/50">Check back later for updates!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
          .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
        `
      }} />
      
      {/* Add custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .tab-btn { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 0.5rem; 
            padding: 0.75rem 1.5rem; 
            background: rgba(255, 255, 255, 0.1); 
            color: #e2e8f0; 
            border: 2px solid transparent; 
            border-radius: 9999px; 
            font-size: 0.9rem; 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.3s ease; 
            backdrop-filter: blur(10px); 
          }
          .tab-btn:hover { 
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
          .tab-btn.active { 
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
        `
      }} />
    </div>
  )
}

export default ExhibitsPageTailwind