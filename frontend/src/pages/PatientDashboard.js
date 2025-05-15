import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import blockchainService from "../services/blockchainService";
import ipfsService from "../services/ipfsService";
import imageService from "../services/imageService";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertMessage from "../components/AlertMessage";

const PatientDashboard = () => {
  const { user } = useAuth();
  const { account } = useWeb3();

  // Patient records
  const [records, setRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Selected record for viewing
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [revealedImage, setRevealedImage] = useState(null);

  // Alert states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch patient records on component mount
  useEffect(() => {
    if (account) {
      fetchPatientRecords();
    }
  }, [account]);

  // Fetch patient records
  const fetchPatientRecords = async () => {
    try {
      setIsLoadingRecords(true);
      setError("");

      const result = await blockchainService.getPatientRecords(account);
      setRecords(result.ipfsHashes || []);

      if (result.ipfsHashes?.length === 0) {
        setSuccess("No records found");
      }
    } catch (err) {
      setError("Failed to fetch records: " + err.message);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Process and reveal a selected image
  const processAndRevealImage = async (record) => {
    try {
      setSelectedRecord(record);
      setIsProcessing(true);
      setProcessStep(1);
      setError("");

      // Step 1: Download the encrypted image from IPFS
      // Use the ipfsService.downloadFile method instead of direct fetch
      // This ensures proper authentication headers are included
      const encryptedImageBlob = await ipfsService.downloadFile(record.cid);

      const encryptedImageFile = new File(
        [encryptedImageBlob],
        `encrypted_${record.cid}.png`,
        { type: "image/png" }
      );

      setProcessStep(2);

      // Step 2: Decrypt the image
      const decryptResult = await imageService.decryptImage(encryptedImageFile);
      // Decryption successful
      setProcessStep(3); // Keep UI step consistent

      const stegoFilename = `stego_${record.cid}.png`;

      const stegoImageFile = await imageService.fetchTempImage(stegoFilename);

      // Step 3: Reveal the hidden image using the fetched stego image
      const revealResult = await imageService.revealImage(stegoImageFile);
      setProcessStep(4); // Move to next step in UI

      // Set the revealed image
      setRevealedImage(revealResult.imageBase64);

      setSuccess("Image revealed successfully!");
    } catch (err) {
      setError(`Processing failed at step ${processStep}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset viewing state
  const resetViewingState = () => {
    setSelectedRecord(null);
    setProcessStep(0);
    setRevealedImage(null);
  };

  // Download revealed image
  const downloadRevealedImage = () => {
    if (!revealedImage) return;

    const link = document.createElement("a");
    link.href = `data:image/png;base64,${revealedImage}`;
    link.download = `revealed_medical_image_${selectedRecord.cid.substring(
      0,
      8
    )}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">Patient Dashboard</h1>

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
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Your Medical Records</h4>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchPatientRecords}
                  disabled={isLoadingRecords}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              {isLoadingRecords ? (
                <LoadingSpinner message="Loading your records..." />
              ) : records.length > 0 ? (
                <div className="list-group">
                  {records.map((record, index) => (
                    <button
                      key={index}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => processAndRevealImage(record)}
                      disabled={isProcessing}
                    >
                      <div>
                        <h6 className="mb-1">Medical Record #{index + 1}</h6>
                        <small
                          className="text-muted text-truncate d-inline-block"
                          style={{ maxWidth: "250px" }}
                        >
                          IPFS: {record.cid}
                        </small>
                      </div>
                      <span className="btn btn-sm btn-primary">
                        <i className="bi bi-eye me-1"></i>
                        View
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  <p className="mb-0">
                    You don't have any medical records yet. Please contact your
                    healthcare provider.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow">
            <div className="card-header">
              <h4 className="mb-0">Your Information</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Username</label>
                <p className="mb-0">{user?.username || "N/A"}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Ethereum Address</label>
                <p className="mb-0 text-break">{account || "Not connected"}</p>
              </div>
              <div>
                <label className="form-label fw-bold">Role</label>
                <p className="mb-0">
                  <span className="badge bg-primary"></span>
                  <span className="badge bg-primary">
                    {user?.role || "Patient"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          {selectedRecord ? (
            <div className="card shadow">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">View Medical Record</h4>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={resetViewingState}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Close
                  </button>
                </div>
              </div>
              <div className="card-body">
                {isProcessing ? (
                  <div className="my-4">
                    <h5 className="mb-3">Retrieving and Processing Image...</h5>
                    <div className="progress mb-3">
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${processStep * 25}%` }}
                      ></div>
                    </div>
                    <ul className="list-group">
                      <li
                        className={`list-group-item ${
                          processStep >= 1 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            processStep >= 1
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Downloading encrypted image from IPFS
                      </li>
                      <li
                        className={`list-group-item ${
                          processStep >= 2 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            processStep >= 2
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Decrypting image
                      </li>
                      <li
                        className={`list-group-item ${
                          processStep >= 3 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            processStep >= 3
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Revealing hidden medical image
                      </li>
                      <li
                        className={`list-group-item ${
                          processStep >= 4 ? "list-group-item-primary" : ""
                        }`}
                      >
                        <i
                          className={`bi ${
                            processStep >= 4
                              ? "bi-check-circle-fill"
                              : "bi-circle"
                          } me-2`}
                        ></i>
                        Process complete
                      </li>
                    </ul>
                  </div>
                ) : revealedImage ? (
                  <div className="text-center">
                    <h5 className="mb-3">Your Medical Image</h5>
                    <div className="mb-3">
                      <img
                        src={`data:image/png;base64,${revealedImage}`}
                        className="img-fluid border rounded"
                        alt="Revealed Medical Image"
                        style={{ maxHeight: "400px" }}
                      />
                    </div>
                    <div className="mb-3">
                      <p className="text-muted">
                        This is your securely stored medical image that was
                        hidden using steganography and protected with
                        encryption.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={downloadRevealedImage}
                    >
                      <i className="bi bi-download me-2"></i>
                      Download Image
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <h5>Processing your medical record</h5>
                    <p>
                      We're retrieving your encrypted data from the blockchain
                      and IPFS network, then decrypting it and extracting the
                      hidden medical image.
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      This process may take a few moments.
                    </p>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <small className="text-muted">
                  IPFS CID: {selectedRecord.cid}
                </small>
              </div>
            </div>
          ) : (
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <i className="bi bi-images fs-1 text-muted mb-3"></i>
                <h4>View Your Medical Images</h4>
                <p className="text-muted">
                  Select a record from the list on the left to view your medical
                  image.
                </p>
                <p className="text-muted small">
                  Your images are securely stored using advanced steganography
                  and encryption technology. Only you can access the actual
                  medical content.
                </p>
              </div>
            </div>
          )}

          <div className="card shadow mt-4">
            <div className="card-header">
              <h4 className="mb-0">Security Information</h4>
            </div>
            <div className="card-body">
              <p>
                <i className="bi bi-shield-lock-fill text-success me-2"></i>
                Your medical records are secure and private. Here's how:
              </p>
              <ul className="mb-0">
                <li>
                  Records are hidden using <strong>steganography</strong>{" "}
                  (concealed in normal-looking images)
                </li>
                <li>
                  Data is <strong>encrypted</strong> before being stored
                </li>
                <li>
                  Files are distributed on <strong>IPFS</strong> (InterPlanetary
                  File System)
                </li>
                <li>
                  Access is controlled by{" "}
                  <strong>blockchain smart contracts</strong>
                </li>
                <li>
                  Only you and authorized medical professionals can access your
                  information
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
