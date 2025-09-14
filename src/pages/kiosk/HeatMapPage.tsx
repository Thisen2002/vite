import React from 'react';
import SvgHeatmap from '../../pages/Heatmap/SvgHeatmap';

interface HeatMapPageTailwindProps {}

const HeatMapPageTailwind: React.FC<HeatMapPageTailwindProps> = () => {
  return (
    <div className="p-12 bg-white/20 rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] backdrop-blur-lg border border-white/18 max-w-[110rem] w-full mx-auto">
      <h2 className="text-center text-white text-4xl font-bold mb-8 drop-shadow-lg">
        Event Heat Map
      </h2>
      <div className="mt-6 rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.15)]">
        <SvgHeatmap />
      </div>
    </div>
  );
}

export default HeatMapPageTailwind;
