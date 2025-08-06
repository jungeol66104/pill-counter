'use client';

import { useState, useEffect } from 'react';

// Declare the `cv` global variable to avoid TypeScript errors
declare global {
  var cv: any;
}

export default function Home() {
  const [image, setImage] = useState<any>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cvReady, setCvReady] = useState(false);

  useEffect(() => {
    // Check when OpenCV.js is ready
    if (typeof window !== 'undefined') {
      const checkCV = () => {
        if (typeof cv !== 'undefined' && cv.Mat) {
          setCvReady(true);
        }
      };

      // Check immediately
      checkCV();

      // Set up a listener for when OpenCV.js loads
      window.addEventListener('opencv-loaded', checkCV);
      
      return () => {
        window.removeEventListener('opencv-loaded', checkCV);
      };
    }
  }, []);

  // Function to handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);
      setImage(imgUrl);
      setCount(null);
    }
  };

  // Function to count pills using OpenCV.js
  const countPills = async () => {
    if (!image || !cvReady) return;
  
    setLoading(true);
  
    try {
      // Create canvas and context to draw the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load the image for processing
      const imgElement = document.createElement('img');
      imgElement.src = image;
      await imgElement.decode();
      
      // Set canvas size to match the image
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      
      // Draw the image to the canvas
      ctx?.drawImage(imgElement, 0, 0);
      
      // Read the image from canvas using OpenCV
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      const mat = cv.matFromImageData(imageData);

      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian Blur
      const blur = new cv.Mat();
      cv.GaussianBlur(gray, blur, new cv.Size(11, 11), 0);

      // Apply Canny edge detection
      const edges = new cv.Mat();
      cv.Canny(blur, edges, 30, 150, 3);

      // Dilate the edges
      const dilated = new cv.Mat();
      const M = cv.Mat.ones(1, 1, cv.CV_8U);
      cv.dilate(edges, dilated, M);

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

      // Draw contours (optional, for debugging)
      const rgb = new cv.Mat();
      cv.cvtColor(mat, rgb, cv.COLOR_RGBA2RGB);
      cv.drawContours(rgb, contours, -1, new cv.Scalar(0, 255, 0), 2);

      // Set the pill count as the number of contours found
      setCount(contours.size());

      // Clean up memory
      mat.delete();
      gray.delete();
      blur.delete();
      edges.delete();
      dilated.delete();
      M.delete();
      contours.delete();
      hierarchy.delete();
      rgb.delete();

    } catch (error) {
      console.error('Error during detection:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-4xl font-bold">Pill Counter</h1>
      
      {!cvReady && (
        <p className="text-red-500">Loading OpenCV.js...</p>
      )}

      {/* Image upload input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="border p-2 rounded-md"
        disabled={!cvReady}
      />

      {/* Display the uploaded image */}
      {image && <img src={image} alt="Uploaded" className="max-w-xs rounded-md" />}
      
      {/* Button to trigger pill counting */}
      <button
        onClick={countPills}
        className="mt-4 bg-blue-500 text-white p-2 rounded-md disabled:bg-gray-400"
        disabled={loading || !cvReady || !image}
      >
        {loading ? 'Counting...' : 'Count Pills'}
      </button>

      {/* Display the pill count */}
      {count !== null && !loading && (
        <p className="mt-4 text-xl font-semibold">Pill Count: {count}</p>
      )}
    </div>
  );
}
