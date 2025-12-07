import React from 'react';
import OParfait from '@/assets/O_parfait.svg?react';

export const Loader = () => {
  return (
    <div className="w-[95px] h-[91px] flex items-center justify-center">
      {/* wrapper animé lentement à 1 Hz */}
      <div className="w-full h-full flex items-center justify-center custom-spinner-slow scale-[0.125]">
        {/* SVG animé rapidement à 4 Hz */}
        <OParfait className="w-full h-full custom-spinner-fast" />
      </div>
    </div>
  );
};
