import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

const ImageUploader = ({
  onFileSelect,
  acceptedTypes = "image/*",
  maxSize = 5242880, // 5MB default max size
  label = "Upload Image",
  className = "",
  previewImage = true,
  showFileName = true,
}) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");

    if (!file) return;

    // Validate file type
    if (!file.type.match(acceptedTypes.replace("*", ".*"))) {
      setError(
        `Invalid file type. Please upload ${acceptedTypes.replace("*", "")}`
      );
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(
        `File is too large. Maximum size is ${Math.round(
          maxSize / 1024 / 1024
        )}MB`
      );
      return;
    }

    // Set filename
    setFileName(file.name);

    // Generate preview if enabled
    if (previewImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    // Call the callback
    onFileSelect(file);
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreview(null);
    setFileName("");
    setError("");
    onFileSelect(null);
  };

  return (
    <div className={`image-uploader ${className}`}>
      <div className="mb-3">
        <label className="form-label">{label}</label>
        <input
          type="file"
          className="form-control"
          accept={acceptedTypes}
          onChange={handleFileChange}
          ref={fileInputRef}
        />

        {error && <div className="text-danger mt-2">{error}</div>}

        {showFileName && fileName && !error && (
          <div className="mt-2">
            <span className="text-muted">Selected file: </span>
            <span>{fileName}</span>
            <button
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={clearFile}
              type="button"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {previewImage && preview && !error && (
        <div className="mt-3 image-preview">
          <img
            src={preview}
            alt="Preview"
            className="img-thumbnail"
            style={{ maxHeight: "200px" }}
          />
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  acceptedTypes: PropTypes.string,
  maxSize: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
  previewImage: PropTypes.bool,
  showFileName: PropTypes.bool,
};

export default ImageUploader;
