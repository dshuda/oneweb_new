import api from "@/lib/api";
import { headers } from "next/headers";
import React, { Fragment, useEffect, useState, ChangeEvent } from "react";

interface UploadImageProps {
  path: string;
  onSelect: (url: string) => void;
}

const UploadImage: React.FC<UploadImageProps> = ({
  path,
  onSelect,
}) => {
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7106';
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch images from path
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        // Example API call
        const res = await api.get(path);
        
        setImages(res.data.images || []);
      } catch (error) {
        console.error("Failed to load images", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [path]);

const handleUpload = async (
  e: ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  // Only allow image
  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    return;
  }

  try {
    const formData = new FormData();

    // "image" must match ASP.NET IFormFile image
    formData.append("image", file);

    const res = await api.post(
      path,
      formData
    );
    if (res.data) {
     // setImages((prev) => [{url: res.data.url}, ...prev]);
      onSelect(res.data.url);
    }
  } catch (error) {
    console.error("Upload failed", error);
  }
};

  return (
    <Fragment>
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100">
          <div className="space-y-4">
            {/* Upload Option */}
            <div>
              <label className="block mb-2 font-medium">
                Upload New Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
              />
            </div>

            {/* Image List */}
            <div className="grid grid-cols-3 gap-4">
              {loading && <p>Loading images...</p>}

              {!loading &&
                images.map((img, index) => (
                  <img
                    key={index}
                    src={BASE_URL+img.url}
                    alt={`uploaded-${index}`}
                    className="w-full h-32 object-cover rounded cursor-pointer border hover:scale-105 transition"
                    onClick={() => onSelect(img.url)}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default UploadImage;