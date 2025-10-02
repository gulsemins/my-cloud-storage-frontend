import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import AuthGuard from "./AuthGuard";
import GuestGuard from "./GuestGuard";
import PublicDownloadPage from "../pages/DownloadPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
  {
    path: "/login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestGuard>
        <RegisterPage />
      </GuestGuard>
    ),
  },
  {
    path: "/:fileId/publicDownload",
    element: <PublicDownloadPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" />, // Redirect any other path to dashboard
  },
]);
