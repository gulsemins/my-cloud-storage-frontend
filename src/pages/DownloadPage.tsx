import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import {
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import axios from "axios";

const PublicDownloadPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchDownloadUrl = async () => {
      if (!fileId) {
        setError("Invalid download link");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8080/file/${fileId}/publicDownload`
        );

        if (response.data) {
          setDownloadUrl(response.data);
        } else {
          setError("Failed to retrieve download link");
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("File not found or link has expired");
        } else {
          setError(
            err.response?.data?.message || "Failed to load file information"
          );
        }
        console.error("Error fetching download URL:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadUrl();
  }, [fileId]);

  const handleDownload = async () => {
    if (!downloadUrl) return;

    setDownloading(true);
    try {
      // Open the presigned URL in a new tab to trigger download
      window.open(downloadUrl, "_blank");

      // Show success feedback after a brief delay
      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to start download");
      console.error("Download error:", err);
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading file information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
            }}
          >
            <ErrorIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Unable to Access File
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This link may have expired or the file may no longer be available.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <CloudDownloadIcon
            sx={{
              fontSize: 80,
              color: "primary.main",
              mb: 2,
            }}
          />

          <Typography variant="h4" gutterBottom>
            File Ready for Download
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" color="text.secondary" paragraph>
            Your file is ready to be downloaded. Click the button below to start
            downloading.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="body2">
              <strong>Note:</strong> This download link is temporary and will
              expire soon. Make sure to download the file now.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            size="large"
            startIcon={
              downloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={handleDownload}
            disabled={downloading || !downloadUrl}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
            }}
          >
            {downloading ? "Starting Download..." : "Download File"}
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2 }}
          >
            Having trouble downloading? Try a different browser or contact the
            person who shared this file.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PublicDownloadPage;
