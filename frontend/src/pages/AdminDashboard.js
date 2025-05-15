import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import blockchainService from "../services/blockchainService";
import ipfsService from "../services/ipfsService";
import imageService from "../services/imageService";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertMessage from "../components/AlertMessage";
import ImageUploader from "../components/ImageUploader";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { account } = useWeb3();

  // States for patient records section
  const [patientAddress, setPatientAddress] = useState("");
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // States for image upload section
  const [coverImage, setCoverImage] = useState(null);
  const [secretImage, setSecretImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [patientForUpload, setPatientForUpload] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ipfsCid, setIpfsCid] = useState("");

  // Alert states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch patient records
  const fetchPatientRecords = async () => {
    if (!patientAddress) {
      setError("Please enter a patient address");
      return;
    }

    try {
      setIsLoadingRecords(true);
      setError("");

      const result = await blockchainService.getPatientRecords(patientAddress);
      setPatientRecords(result.ipfsHashes || []);

      if (result.ipfsHashes?.length === 0) {
        setSuccess("No records found for this patient");
      }
    } catch (err) {
      setError("Failed to fetch patient records: " + err.message);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Process and upload image
  const processAndUploadImage = async (e) => {
    e.preventDefault();

    if (!coverImage || !secretImage) {
      setError("Please select both cover and secret images");
      return;
    }

    if (!patientForUpload) {
      setError("Please enter a patient address");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setCurrentStep(1);

      // Step 1: Hide secret image in cover image
      const stegoResult = await imageService.hideImage(coverImage, secretImage);
      // Create a File object from the original stego image data *now*
      const stegoImageFile = new File(
        [Buffer.from(stegoResult.imageBase64, "base64")],
        "stego_image_original.png", // Temporary filename, backend uses CID
        { type: "image/png" }
      );
      setProcessedImage({
        ...stegoResult,
        step: "steganography",
      });
      setCurrentStep(2);

      // Step 2: Encrypt the stego image (using the file we just created)
      const encryptResult = await imageService.encryptImage(stegoImageFile);
      // Create a File object for the *encrypted* data for IPFS upload
      const encryptedImageFile = new File(
        [Buffer.from(encryptResult.imageBase64, "base64")],
        "encrypted_image.png",
        { type: "image/png" }
      );
      setProcessedImage({
        ...encryptResult,
        step: "encryption",
      });
      setCurrentStep(3);

      // Step 3: Upload encrypted image to IPFS
      const uploadResult = await ipfsService.uploadFile(encryptedImageFile);
      setIpfsCid(uploadResult.cid);
      setCurrentStep(4); // Move to next step: Saving temp stego

      // Step 4: Save original stego image temporarily on backend, named with CID
      await imageService.saveTempStegoImageWithCID(
        stegoImageFile, // The original stego image file
        uploadResult.cid // The CID of the *encrypted* version
      );
      setCurrentStep(5); // Move to next step: Blockchain storage

      // Step 5: Store IPFS hash on blockchain
      await blockchainService.storeIPFSHash(patientForUpload, uploadResult.cid);
      setCurrentStep(6); // Move to final step: Completion

      setSuccess("Image processed and stored successfully!");
    } catch (err) {
      setError(`Processing failed at step ${currentStep}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCoverImage(null);
    setSecretImage(null);
    setProcessedImage(null);
    setPatientForUpload("");
    setCurrentStep(0);
    setIpfsCid("");
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && (
        <AlertMessage
          message={error}
          type="danger"
          onClose={() => setError("")}
        />
      )}

      {success && (
        <AlertMessage
          message={success}
          type="success"
          onClose={() => setSuccess("")}
          autoClose={true}
        />
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="card shadow mb-4">
            <div className="card-header">
              <h4 className="mb-0">Patient Records</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="patientAddress" className="form-label">
                  Patient Ethereum Address
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    id="patientAddress"
                    placeholder="0x..."
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={fetchPatientRecords}
                    disabled={isLoadingRecords}
                  >
                    Fetch Records
                  </button>
                </div>
              </div>

              {isLoadingRecords ? (
                <LoadingSpinner message="Loading records..." />
              ) : patientRecords.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>IPFS CID</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientRecords.map((record, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: "200px" }}
                          >
                            {record.cid}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() =>
                                ipfsService.downloadFile(record.cid)
                              }
                            >
                              <i className="bi bi-download"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() =>
                                window.open(
                                  `https://ipfs.io/ipfs/${record.cid}`,
                                  "_blank"
                                )
                              }
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : patientAddress ? (
                <div className="alert alert-info">
                  No records found for this patient address.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header">
              <h4 className="mb-0">Process New Image</h4>
            </div>
            <div className="card-body">
              <form onSubmit={processAndUploadImage}>
                <div className="mb-3">
                  <label htmlFor="patientForUpload" className="form-label">
                    Patient Ethereum Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="patientForUpload"
                    placeholder="0x..."
                    value={patientForUpload}
                    onChange={(e) => setPatientForUpload(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <ImageUploader
                      label="Cover Image"
                      onFileSelect={setCoverImage}
                      acceptedTypes="image/*"
                    />
                  </div>
                  <div className="col-md-6">
                    <ImageUploader
                      label="Secret Image (Medical)"
                      onFileSelect={setSecretImage}
                      acceptedTypes="image/*"
                    />
                  </div>
                </div>

                {isProcessing ? (
                  <div className="my-4">
                    <h5 className="mb-3">Processing Images...</h5>
                    <div className="progress mb-3">
                      {/* Adjust width calculation for 6 steps (100 / 6 = ~16.67) */}
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${currentStep * (100 / 6)}%` }}
                      ></div>
                    </div>
                    <ul className="list-group">
                      {/* Step 1 */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 1 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 1
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Hiding medical image with steganography
                      </li>
                      {/* Step 2 */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 2 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 2
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Encrypting stego image
                      </li>
                      {/* Step 3 */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 3 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 3
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Uploading encrypted image to IPFS
                      </li>
                       {/* Step 4 (New) */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 4 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 4
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Saving temporary stego image reference
                      </li>
                      {/* Step 5 */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 5 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 4
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Storing IPFS hash on blockchain
                      </li>
                      {/* Step 6 */}
                      <li
                        className={`list-group-item ${
                          currentStep >= 6 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            currentStep >= 5
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Process complete
                      </li>
                    </ul>
                  </div>
                ) : currentStep === 6 ? ( // Check for step 6 now
                  <div className="alert alert-success">
                    <h5>Process Complete!</h5>
                    <p>IPFS CID: {ipfsCid}</p>
                    <button
                      type="button"
                      className="btn btn-outline-primary mt-2"
                      onClick={resetForm}
                    >
                      Process Another Image
                    </button>
                  </div>
                ) : (
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        !coverImage || !secretImage || !patientForUpload
                      }
                    >
                      Process and Upload
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
