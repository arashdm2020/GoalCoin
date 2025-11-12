'use client';

interface EvidenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
}

const EvidenceViewer = ({ isOpen, onClose, mediaUrl }: EvidenceViewerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-white text-2xl">&times;</button>
        {/* Assuming the media is an image for now */}
        <img src={mediaUrl} alt="Evidence" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

export default EvidenceViewer;
