/**
 * ImageCapture Component
 * 
 * A modal component that allows users to capture or upload images of fuel price signs.
 * Provides both camera capture and file upload functionality with user guidance.
 */

import { useState, useRef } from 'react';
import { FaCamera, FaImage, FaTimes, FaInfoCircle } from 'react-icons/fa';

/**
 * Props interface for the ImageCapture component
 * 
 * @interface ImageCaptureProps
 * @property {() => void} onClose - Callback function to close the modal
 * @property {(imageData: string | null, file: File | null) => void} onImageCapture - Callback function to handle captured/uploaded image
 */
interface ImageCaptureProps {
  onClose: () => void;
  onImageCapture: (imageData: string | null, file: File | null) => void;
}

/**
 * ImageCapture Component
 * 
 * A modal component that provides functionality for capturing or uploading images
 * of fuel price signs. Supports both camera capture and file upload with user guidance.
 * 
 * @param {ImageCaptureProps} props - Component props
 * @returns {JSX.Element} The ImageCapture component
 */
export default function ImageCapture({ onClose, onImageCapture }: ImageCaptureProps) {
  // State management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showTips, setShowTips] = useState(false);

  /**
   * Starts the camera stream and sets up video element
   * 
   * @async
   * @returns {Promise<void>}
   */
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
      // Show tips automatically when camera starts
      setShowTips(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  /**
   * Stops the camera stream and cleans up resources
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  /**
   * Captures an image from the video stream and converts it to a file
   */
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        
        // Convert base64 to file
        fetch(imageData)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
          });
        
        stopCamera();
      }
    }
  };

  /**
   * Handles file selection from input element
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input change event
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Confirms the selected/captured image and closes the modal
   */
  const handleConfirm = () => {
    onImageCapture(selectedImage, selectedFile);
    onClose();
  };

  /**
   * Renders tips for taking good fuel price photos
   * 
   * @returns {JSX.Element} Tips section component
   */
  const renderPhotoTips = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-start">
        <FaInfoCircle className="text-blue-500 mt-1 mr-2 h-5 w-5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-800">Tips for Clear Fuel Price Photos</h4>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc pl-4">
            <li>Hold your phone steady and perpendicular to the sign</li>
            <li>Ensure fuel prices are clearly visible in the frame</li>
            <li>Avoid glare, reflections and shadows on the sign</li>
            <li>Make sure there's good lighting</li>
            <li>Center the price display in your photo</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <FaTimes className="w-6 h-6" />
          </button>

          <h3 className="text-xl font-semibold mb-4">Capture Fuel Price</h3>

          {/* Camera view */}
          {showCamera ? (
            <div className="space-y-4">
              {showTips && renderPhotoTips()}
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border-2 border-dashed border-gray-300"
                />
                {/* Camera overlay frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-dashed border-yellow-500 w-3/4 h-3/5 rounded-md opacity-50"></div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={captureImage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Capture
                </button>
              </div>
            </div>
          ) : selectedImage ? (
            // Preview mode
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full rounded-lg"
              />
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedFile(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            // Initial selection mode
            <div className="space-y-4">
              {renderPhotoTips()}
              <div className="grid grid-cols-2 gap-4">
                {/* Camera button */}
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                >
                  <FaCamera className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Take Photo</span>
                </button>
                
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                >
                  <FaImage className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Upload Photo</span>
                </button>
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 