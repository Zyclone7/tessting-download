import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Download, Printer, ChevronDown, ChevronRight } from 'lucide-react';

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExportImage: () => void;
  onPrint: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const TreeControls: React.FC<TreeControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onExportImage,
  onPrint,
  onToggleFullscreen,
  isFullscreen,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
      <Button variant="outline" size="sm" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onResetView}>
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onExportImage}>
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
        {isFullscreen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

