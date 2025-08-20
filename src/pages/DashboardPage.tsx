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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { filesize } from "filesize";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { UploadedFile, SharedFile } from "../types";

// Paylaşım diyalogu için props tipi
interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onShare: (username: string) => Promise<void>;
  fileName: string;
  loading: boolean;
  error: string | null;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  onShare,
  fileName,
  loading,
  error,
}) => {
  const [username, setUsername] = useState("");

  const handleShareClick = () => {
    onShare(username);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Share "{fileName}"</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Enter the username of the person you want to share this file with.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="username"
          label="Username"
          type="text"
          fullWidth
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleShareClick} disabled={loading || !username}>
          {loading ? <CircularProgress size={24} /> : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DashboardPage: React.FC = () => {
  const [myFiles, setMyFiles] = useState<UploadedFile[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });
  const [activeTab, setActiveTab] = useState(0);

  // Paylaşım diyalogu state'leri
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const { logout } = useAuth();

  const fetchMyFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UploadedFile[]>("/files");
      setMyFiles(response.data);
    } catch (err) {
      setError("Failed to fetch your files.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSharedFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<SharedFile[]>("/shared-with-me");
      setSharedFiles(response.data);
    } catch (err) {
      setError("Failed to fetch files shared with you.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchMyFiles();
    } else {
      fetchSharedFiles();
    }
  }, [activeTab, fetchMyFiles, fetchSharedFiles]);

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
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotification({ open: true, message: "File uploaded successfully!" });
      fetchMyFiles(); // Refresh the file list
    } catch (err) {
      setError("File upload failed.");
      console.error(err);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      // Backend'deki download endpoint'i dosya sahibini kontrol ediyor.
      // Paylaşılan dosyalarda bu kısım backend'de düzenlenmeli.
      // Şimdilik, sadece /files/{fileId}/download'a istek atıyoruz.
      // Backend'de bu endpoint'in paylaşılan dosyalar için de yetkilendirme yapması gerekir.
      const response = await api.get(`/${fileId}/download`, {
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
      setError("File download failed. You may not have permission.");
      console.error(err);
    }
  };

  const handleOpenShareDialog = (file: UploadedFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
    setShareError(null);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
  };

  const handleShareFile = async (username: string) => {
    if (!selectedFile) return;
    setShareLoading(true);
    setShareError(null);
    try {
      await api.post("/share", {
        fileId: selectedFile.id,
        sharedWithUsername: username,
      });
      setNotification({
        open: true,
        message: `File shared successfully with ${username}!`,
      });
      handleCloseShareDialog();
    } catch (err: any) {
      setShareError(
        err.response?.data?.message ||
          "Failed to share file. User may not exist."
      );
      console.error(err);
    } finally {
      setShareLoading(false);
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
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
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

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="file tabs"
          >
            <Tab label="My Files" />
            <Tab label="Shared With Me" />
          </Tabs>
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
            {activeTab === 0 ? (
              // My Files Table
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Upload Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="subtitle1" sx={{ p: 3 }}>
                          No files found. Upload your first file!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    myFiles.map((file) => (
                      <TableRow key={file.id} hover>
                        <TableCell component="th" scope="row">
                          {file.originalFileName}
                        </TableCell>
                        <TableCell align="right">
                          {filesize(file.size)}
                        </TableCell>
                        <TableCell align="right">
                          {format(new Date(file.uploadedAt), "Pp")}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Share">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenShareDialog(file)}
                            >
                              <ShareIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleFileDownload(
                                  file.id,
                                  file.originalFileName
                                )
                              }
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              // Shared With Me Table
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Shared By</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Date Shared</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sharedFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="subtitle1" sx={{ p: 3 }}>
                          No files have been shared with you.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sharedFiles.map((sharedFile) => (
                      <TableRow key={sharedFile.id} hover>
                        <TableCell component="th" scope="row">
                          {sharedFile.file.originalFileName}
                        </TableCell>
                        <TableCell>{sharedFile.sharedBy.username}</TableCell>
                        <TableCell align="right">
                          {filesize(sharedFile.file.size)}
                        </TableCell>
                        <TableCell align="right">
                          {format(new Date(sharedFile.createdAt), "Pp")}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Download">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleFileDownload(
                                  sharedFile.file.id,
                                  sharedFile.file.originalFileName
                                )
                              }
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </Container>

      {selectedFile && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={handleCloseShareDialog}
          onShare={handleShareFile}
          fileName={selectedFile.originalFileName}
          loading={shareLoading}
          error={shareError}
        />
      )}

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
