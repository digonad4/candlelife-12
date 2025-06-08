
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image, Paperclip, X } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface AttachmentUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export const AttachmentUpload = ({ onFileSelect, isUploading }: AttachmentUploadProps) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleCameraCapture = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        // Convert data URL to File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onFileSelect(file);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
    setShowOptions(false);
  };

  const handleGallerySelect = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
        
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });

        if (image.dataUrl) {
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onFileSelect(file);
        }
      } else {
        // Web file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            onFileSelect(file);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
    setShowOptions(false);
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };
    input.click();
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowOptions(!showOptions)}
        disabled={isUploading}
        className="h-8 w-8"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {showOptions && (
        <div className="absolute bottom-full right-0 mb-2 bg-background border rounded-lg shadow-lg p-2 space-y-1 min-w-[120px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCameraCapture}
            className="w-full justify-start"
          >
            <Camera className="h-4 w-4 mr-2" />
            Câmera
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGallerySelect}
            className="w-full justify-start"
          >
            <Image className="h-4 w-4 mr-2" />
            Galeria
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFileSelect}
            className="w-full justify-start"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Arquivo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(false)}
            className="w-full justify-start"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};
