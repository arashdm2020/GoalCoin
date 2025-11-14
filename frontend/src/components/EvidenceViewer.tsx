'use client';

interface EvidenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
}

const EvidenceViewer = ({ isOpen, onClose, mediaUrl }: EvidenceViewerProps) => {
  if (!isOpen) return null;

  // Detect if the URL is a video based on file extension
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(mediaUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute -top-8 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
        >
          &times;
        </button>
        {isVideo ? (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img 
            src={mediaUrl} 
            alt="Evidence" 
            className="w-full h-full object-contain" 
          />
        )}
      </div>
    </div>
  );
};

export default EvidenceViewer;
