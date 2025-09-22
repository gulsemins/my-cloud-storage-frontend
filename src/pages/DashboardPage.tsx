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
  Breadcrumbs,
  Link,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  CreateNewFolder as CreateNewFolderIcon,
  ArrowBack as ArrowBackIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import {
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { filesize } from "filesize";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

// Type definitions
interface UploadedFile {
  id: string;
  originalFileName: string;
  storedFileName: string;
  size: number;
  uploadedAt: string;
  createdAt: string;
  folderId: string | null; // Updated to match your DTO
}

interface SharedFile {
  id: string;
  file: UploadedFile;
  sharedBy: {
    id: string;
    username: string;
    email: string;
  };
  sharedWith: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  parentFolderId: string | null;
}

// Share Dialog Component
interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onShare: (username: string) => Promise<void>;
  onCreatePublicLink: () => Promise<string>;
  fileName: string;
  loading: boolean;
  error: string | null;
  publicLinkLoading: boolean;
  publicLinkError: string | null;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  onShare,
  onCreatePublicLink,
  fileName,
  loading,
  error,
  publicLinkLoading,
  publicLinkError,
}) => {
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [publicLink, setPublicLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShareClick = () => {
    onShare(username);
  };

  const handleCreatePublicLink = async () => {
    try {
      const link = await onCreatePublicLink();
      setPublicLink(link);
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleClose = () => {
    setUsername("");
    setPublicLink("");
    setLinkCopied(false);
    setActiveTab(0);
    onClose();
  };

  const TabPanel = ({
    children,
    value,
    index,
  }: {
    children: React.ReactNode;
    value: number;
    index: number;
  }) => (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Share "{fileName}"</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="share options"
          >
            <Tab icon={<PersonIcon />} label="Share with User" />
            <Tab icon={<LinkIcon />} label="Public Link" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
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
            placeholder="Enter username..."
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DialogContentText sx={{ mb: 2 }}>
            Create a public link that anyone can use to download this file. The
            link will expire in 24 hours.
          </DialogContentText>

          {publicLinkError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {publicLinkError}
            </Alert>
          )}

          {!publicLink ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={handleCreatePublicLink}
                disabled={publicLinkLoading}
                size="large"
              >
                {publicLinkLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Creating Link...
                  </>
                ) : (
                  "Create Public Link"
                )}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Anyone with this link will be able to download the file
              </Typography>
            </Box>
          ) : (
            <Paper sx={{ p: 2, bgcolor: "background.paper" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Public Link Created
              </Typography>
              <TextField
                fullWidth
                value={publicLink}
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiInputBase-root": {
                    color: "common.black",
                  },
                  "& .MuiInputBase-input": {
                    color: "common.black",
                  },
                }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={linkCopied ? "Copied!" : "Copy link"}>
                        <IconButton
                          onClick={handleCopyLink}
                          color={linkCopied ? "success" : "primary"}
                          size="small"
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                This link will expire in 24 hours
              </Typography>
            </Paper>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {activeTab === 0 && (
          <Button
            onClick={handleShareClick}
            disabled={loading || !username.trim()}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : "Share"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
// Create Folder Dialog Component
interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, parentFolderId?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  currentFolderId?: string;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  onCreate,
  loading,
  error,
  currentFolderId,
}) => {
  const [folderName, setFolderName] = useState("");

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreate(folderName.trim(), currentFolderId);
    }
  };

  const handleClose = () => {
    setFolderName("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="folderName"
          label="Folder Name"
          type="text"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && folderName.trim()) {
              handleCreate();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={loading || !folderName.trim()}>
          {loading ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DashboardPage: React.FC = () => {
  const [myFiles, setMyFiles] = useState<UploadedFile[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [publicLinkError, setPublicLinkError] = useState<string | null>(null);
  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "Home" }]);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Create folder dialog state
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(
    null
  );

  const { logout } = useAuth();

  const fetchMyFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UploadedFile[]>("/files");
      console.log("Raw files from backend:", response.data);

      // Debug: Check each file's folder association
      response.data.forEach((file) => {
        console.log(
          `File: ${file.originalFileName}, FolderId: ${file.folderId}`
        );
      });

      setMyFiles(response.data);
    } catch (err) {
      setError("Failed to fetch your files.");
      console.error("Files fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      if (currentFolderId) {
        // Fetch subfolders of current folder
        response = await api.get<Folder[]>(`/subFolders/${currentFolderId}`);
      } else {
        // Fetch root level folders (folders with no parent)
        response = await api.get<Folder[]>("/folders");
      }
      setFolders(response.data);
      console.log("Fetched folders:", response.data); // Debug log
    } catch (err) {
      setError("Failed to fetch folders.");
      console.error("Folder fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

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
      Promise.all([fetchMyFiles(), fetchFolders()]);
    } else {
      fetchSharedFiles();
    }
  }, [
    activeTab,
    currentFolderId,
    fetchMyFiles,
    fetchFolders,
    fetchSharedFiles,
  ]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Debug: Log what we're sending
    console.log("Current folder ID:", currentFolderId);
    console.log("Folder history:", folderHistory);

    if (currentFolderId) {
      formData.append("folderId", currentFolderId);
      console.log("Adding folderId to form data:", currentFolderId);
    } else {
      console.log("No folder ID - uploading to root");
    }

    // Debug: Check FormData contents
    for (let pair of formData.entries()) {
      console.log("FormData:", pair[0], pair[1]);
    }

    setUploading(true);
    setError("");
    try {
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Upload response:", response.data);

      setNotification({ open: true, message: "File uploaded successfully!" });

      // Wait a moment then refresh to ensure backend processing is complete
      setTimeout(async () => {
        await fetchMyFiles();
        await fetchFolders();
      }, 500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError("File upload failed: " + errorMessage);
      console.error("Upload error:", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
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

  const handleCreateFolder = async (name: string, parentFolderId?: string) => {
    setCreateFolderLoading(true);
    setCreateFolderError(null);
    try {
      await api.post("/createFolders", {
        name,
        parentFolderId: parentFolderId || null,
      });
      setNotification({
        open: true,
        message: "Folder created successfully!",
      });
      setCreateFolderDialogOpen(false);
      fetchFolders();
    } catch (err: any) {
      setCreateFolderError(
        err.response?.data?.message || "Failed to create folder."
      );
      console.error(err);
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleFolderDoubleClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    const targetFolder = newHistory[newHistory.length - 1];
    setCurrentFolderId(targetFolder.id);
    setFolderHistory(newHistory);
  };

  const handleBackClick = () => {
    if (folderHistory.length > 1) {
      const newHistory = folderHistory.slice(0, -1);
      const parentFolder = newHistory[newHistory.length - 1];
      setCurrentFolderId(parentFolder.id);
      setFolderHistory(newHistory);
    }
  };

  const handleOpenShareDialog = (file: UploadedFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
    setShareError(null);
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

  // Filter files that belong to current folder
  const currentFolderFiles = myFiles.filter((file) => {
    if (currentFolderId) {
      // When in a specific folder, show only files that belong to this folder
      return file.folderId === currentFolderId;
    } else {
      // When in root, show only files that have no folderId or folderId is null
      return !file.folderId || file.folderId === null;
    }
  });

  const handleCreatePublicLink = async (): Promise<string> => {
    if (!selectedFile) throw new Error("No file selected");

    setPublicLinkLoading(true);
    setPublicLinkError(null);

    try {
      const response = await api.post(`/${selectedFile.id}/createPublicLink`);
      const publicLink = response.data; // The backend returns the link as a string

      setNotification({
        open: true,
        message: "Public link created successfully!",
      });

      return publicLink;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create public link.";
      setPublicLinkError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setPublicLinkLoading(false);
    }
  };

  // Update your handleCloseShareDialog function
  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
    setPublicLinkError(null); // Reset public link error
  };

  console.log("Current folder ID:", currentFolderId);
  console.log("All files:", myFiles);
  console.log("Current folder files:", currentFolderFiles);

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
          <Box sx={{ display: "flex", gap: 1 }}>
            {activeTab === 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CreateNewFolderIcon />}
                  onClick={() => setCreateFolderDialogOpen(true)}
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
              </>
            )}
          </Box>
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

        {activeTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {folderHistory.length > 1 && (
                <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1 }}>
                {folderHistory.map((folder, index) => (
                  <Link
                    key={folder.id || "root"}
                    color="inherit"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBreadcrumbClick(index);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    {folder.name}
                  </Link>
                ))}
              </Breadcrumbs>
            </Box>
          </Box>
        )}

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
            sx={{ maxHeight: "calc(100vh - 350px)", overflow: "auto" }}
          >
            {activeTab === 0 ? (
              // My Files and Folders Table
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Date Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {folders.length === 0 && currentFolderFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="subtitle1" sx={{ p: 3 }}>
                          {currentFolderId
                            ? "This folder is empty. Upload files or create subfolders!"
                            : "No files or folders found. Upload your first file or create a folder!"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Render folders first */}
                      {folders.map((folder) => (
                        <TableRow
                          key={folder.id}
                          hover
                          onClick={() => handleFolderDoubleClick(folder)}
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "action.hover",
                              "& .folder-name": {
                                color: "primary.main",
                              },
                            },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                "&:hover": {
                                  color: "primary.main",
                                },
                              }}
                            >
                              <FolderIcon
                                sx={{ mr: 1, color: "primary.main" }}
                              />
                              <Typography
                                className="folder-name"
                                variant="body1"
                                sx={{
                                  transition: "color 0.2s",
                                }}
                              >
                                {folder.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Folder"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">—</TableCell>
                          <TableCell align="right">
                            {format(new Date(folder.createdAt), "Pp")}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Open Folder">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent double navigation
                                  handleFolderDoubleClick(folder);
                                }}
                              >
                                <FolderOpenIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Then render files */}
                      {currentFolderFiles.map((file) => (
                        <TableRow key={file.id} hover>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <FileIcon
                                sx={{ mr: 1, color: "text.secondary" }}
                              />
                              {file.originalFileName}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="File"
                              size="small"
                              variant="outlined"
                            />
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
                      ))}
                    </>
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
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <FileIcon sx={{ mr: 1, color: "text.secondary" }} />
                            {sharedFile.file.originalFileName}
                          </Box>
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

      {/* Share Dialog */}
      {selectedFile && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={handleCloseShareDialog}
          onShare={handleShareFile}
          onCreatePublicLink={handleCreatePublicLink}
          fileName={selectedFile.originalFileName}
          loading={shareLoading}
          error={shareError}
          publicLinkLoading={publicLinkLoading}
          publicLinkError={publicLinkError}
        />
      )}

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        onCreate={handleCreateFolder}
        loading={createFolderLoading}
        error={createFolderError}
        currentFolderId={currentFolderId || undefined}
      />

      {/* Notification Snackbar */}
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
