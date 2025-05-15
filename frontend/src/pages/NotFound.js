import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="container py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body py-5">
              <h1 className="display-1 mb-4">404</h1>
              <h2 className="mb-4">Page Not Found</h2>
              <p className="lead mb-4">
                The page you are looking for doesn't exist or has been moved.
              </p>
              <Link to="/" className="btn btn-primary btn-lg">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
