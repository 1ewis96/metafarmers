import React from "react";
import { Link } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";
import { FaSignInAlt, FaUserPlus, FaLock } from "react-icons/fa";
import useAuthCheck from "../hooks/auth/TokenValidation"; // Import the useAuthCheck hook
import { useUser } from "../context/UserContext"; // Import the useUser hook

const Navigation = () => {
  // Authentication Check (using useAuthCheck)
  const { isAuthenticated } = useAuthCheck();

  // User Data from Context
  const { userData } = useUser();

  const cognitoURL = process.env.REACT_APP_COGNITO_URL;
  const s3Bucket = process.env.REACT_APP_S3_URL;
  const cognitoClientID = process.env.REACT_APP_COGNITO_CLIENT_ID;
  const logoutReturnURL = process.env.REACT_APP_LOGOUT_RETURN_URL;
  const signupReturnURL = process.env.REACT_APP_SIGNUP_RETURN_URL;
  const forgotPasswordReturnURL = process.env.REACT_APP_FORGOT_PASSWORD_RETURN_URL;

  return (
    <Navbar bg="dark" variant="dark" expand={true}>
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src={`${s3Bucket}/static/mf-logo.png`}
            alt="Logo"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
          />
          MetaFarmers
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto"></Nav>

          {/* Authenticated State */}
          {isAuthenticated ? (
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="dark"
                  id="profile-dropdown"
                  className="d-flex align-items-center"
                >
                  {/* Use userData.avatar.path if available */}
                  <img
                    src={userData?.avatar?.path ? `${s3Bucket}/avatars/${userData.avatar.path}` : `${s3Bucket}/avatars/default.jpg`}
                    alt="Profile"
                    width="40"
                    height="40"
                    style={{
                      borderRadius: "50%",
                      marginRight: "10px",
                      objectFit: "cover",
                      border: "3px solid #fff",
                    }}
                  />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item disabled>
                    <pre style={{ width: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Hello: {userData?.username}
                    </pre>
                  </Dropdown.Item>
                  <Dropdown.Item disabled>
                    <pre style={{ width: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Email: {userData?.email}
                    </pre>
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings">
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => {
                      const logoutUrl = `${cognitoURL}/logout?client_id=${cognitoClientID}&logout_uri=${logoutReturnURL}`;
                      window.location.href = logoutUrl;
                    }}
                  >
                    Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          ) : (
            // Unauthenticated State
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="dark"
                  id="profile-dropdown"
                  className="d-flex align-items-center"
                >
                  <img
                    src={`${s3Bucket}/avatars/default.jpg`}
                    alt="Profile"
                    width="40"
                    height="40"
                    style={{
                      borderRadius: "50%",
                      marginRight: "10px",
                      objectFit: "cover",
                      border: "3px solid #fff",
                    }}
                  />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    className="d-flex justify-content-between align-items-center"
                    href={`${cognitoURL}/login?client_id=${cognitoClientID}&response_type=code&scope=openid&redirect_uri=${signupReturnURL}`} // Direct URL
                  >
                    Sign In <FaSignInAlt className="ms-2" />
                  </Dropdown.Item>

                  <Dropdown.Item
                    className="d-flex justify-content-between align-items-center"
                    href={`${cognitoURL}/signup?client_id=${cognitoClientID}&response_type=code&scope=openid&redirect_uri=${signupReturnURL}`} // Direct URL
                  >
                    Sign Up <FaUserPlus className="ms-2" />
                  </Dropdown.Item>

                  <Dropdown.Item
                    className="d-flex justify-content-between align-items-center"
                    href={`${cognitoURL}/forgotPassword?client_id=${cognitoClientID}&response_type=code&scope=openid&redirect_uri=${forgotPasswordReturnURL}`} // Direct URL
                  >
                    Forgot Password <FaLock className="ms-2" />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
