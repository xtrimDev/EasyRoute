import React from "react";
import { ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import ControlButton from "./ControlButton";

import { useMap } from "./MapContext";

const Controls = ({ toggleFullscreen, isFullscreen }) => {
  const map = useMap();

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-5">
      <div className="flex flex-col space-y-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
        <ControlButton onClick={() => map.zoomIn()} tooltip="Zoom In" className="cursor-pointer">
          <ZoomIn size={20} />
        </ControlButton>

        <ControlButton onClick={() => map.zoomOut()} tooltip="Zoom Out" className="cursor-pointer">
          <ZoomOut size={20} />
        </ControlButton>

        <div className="border-t border-gray-200 my-1"></div>

        <ControlButton onClick={toggleFullscreen} tooltip="Toggle Fullscreen" className="cursor-pointer">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </ControlButton>
      </div>
    </div>
  );
};

export default Controls;
