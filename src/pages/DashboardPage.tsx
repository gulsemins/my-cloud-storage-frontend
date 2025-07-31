import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  CreateNewFolder as CreateNewFolderIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { filesize } from "filesize";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { UploadedFile } from "../types";

const DashboardPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });
  const { logout } = useAuth();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UploadedFile[]>("/files");
      setFiles(response.data);
    } catch (err) {
      setError("Failed to fetch files.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError("");
    try {
      await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setNotification({ open: true, message: "File uploaded successfully!" });
      fetchFiles(); // Refresh the file list
    } catch (err) {
      setError("File upload failed.");
      console.error(err);
    } finally {
      setUploading(false);
      // Reset file input value to allow uploading the same file again
      event.target.value = "";
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("File download failed.");
      console.error(err);
    }
  };

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Cloud Storage
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={logout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Your Files
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolderIcon />}
              onClick={() =>
                setNotification({
                  open: true,
                  message: "Create folder feature coming soon!",
                })
              }
            >
              New Folder
            </Button>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload File"}
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ maxHeight: "calc(100vh - 250px)", overflow: "auto" }}
          >
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="files table">
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Upload Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="subtitle1" sx={{ p: 3 }}>
                        No files found. Upload your first file!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow
                      key={file.id}
                      sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                    >
                      <TableCell component="th" scope="row">
                        {file.originalFileName}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <FolderIcon fontSize="small" color="action" />
                          {file.location || "Root Directory"}
                        </Box>
                      </TableCell>
                      <TableCell>{file.owner || "Me"}</TableCell>
                      <TableCell align="right">{filesize(file.size)}</TableCell>
                      <TableCell align="right">
                        {format(new Date(file.uploadedAt), "Pp")}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 0.5,
                            "& .MuiIconButton-root": {
                              padding: 1,
                            },
                          }}
                        >
                          <Tooltip title="Add to Favorites (Coming Soon)" arrow>
                            <span>
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() =>
                                  setNotification({
                                    open: true,
                                    message: "Favorites feature coming soon!",
                                  })
                                }
                                disabled
                              >
                                <StarIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Share" arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                setNotification({
                                  open: true,
                                  message: "Sharing feature coming soon!",
                                })
                              }
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download" arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                handleFileDownload(
                                  file.id,
                                  file.originalFileName
                                )
                              }
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
      />
    </>
  );
};

export default DashboardPage;
