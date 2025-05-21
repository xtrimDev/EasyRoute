import React, { useState } from "react";

const ControlButton = ({ onClick, tooltip, children, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        className={`p-2 rounded-md hover-gray-100 active-gray-200 transition-colors ${
          className || ""
        }`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {children}
      </button>

      {showTooltip && tooltip && (
        <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default ControlButton;
