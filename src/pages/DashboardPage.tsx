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
  Menu,
  ListItemIcon,
  ListItemText,
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
  MenuItem,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  CreateNewFolder as CreateNewFolderIcon,
  ArrowBack as ArrowBackIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { filesize } from "filesize";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import FilePreviewModal from "../components/FilePreviewModal";
import axios from "axios";

// Type definitions
import type { UploadedFile } from "../types"; // Import the correct type from your types folder

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
  // onCreatePublicLink fonksiyonunun artık expirationHours parametresi alacağını belirt
  onCreatePublicLink: (expirationHours: number) => Promise<string>;
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
  const [expirationHours, setExpirationHours] = useState(24);

  const handleShareClick = () => {
    onShare(username);
  };

  const handleCreatePublicLink = async () => {
    try {
      const link = await onCreatePublicLink(expirationHours);
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
    setExpirationHours(24);
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
            Create a public link that anyone can use to download this file.
            Please select an expiration time.
          </DialogContentText>

          {publicLinkError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {publicLinkError}
            </Alert>
          )}

          {!publicLink ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              {/* YENİ: Geçerlilik süresi seçim alanı */}
              <TextField
                select
                label="Link Expiration"
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value={1}>1 Hour</MenuItem>
                <MenuItem value={6}>6 Hours</MenuItem>
                <MenuItem value={24}>24 Hours (1 Day)</MenuItem>
                <MenuItem value={168}>7 Days</MenuItem>
                <MenuItem value={720}>30 Days</MenuItem>
              </TextField>

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
interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: "file" | "folder";
  loading: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete "{itemName}"? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  // Actions menu state
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionsTarget, setActionsTarget] = useState<{
    id: string;
    type: "file" | "folder";
    file?: UploadedFile;
    folder?: Folder;
  } | null>(null);

  const openActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    target: {
      id: string;
      type: "file" | "folder";
      file?: UploadedFile;
      folder?: Folder;
    }
  ) => {
    event.stopPropagation();
    setActionsAnchorEl(event.currentTarget);
    setActionsTarget(target);
  };

  const closeActionsMenu = () => {
    setActionsAnchorEl(null);
    setActionsTarget(null);
  };

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

  // Rename folder dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);

  const { logout } = useAuth();

  const fetchMyFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UploadedFile[]>("/file/getAllFiles");
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
        response = await api.get<Folder[]>(
          `/folder/subFolders/${currentFolderId}`
        );
      } else {
        // Fetch root level folders (folders with no parent)
        response = await api.get<Folder[]>("/folder/allRootFolders");
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
      const response = await api.get<SharedFile[]>("/file/shared-with-me");
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
  const handleFileClick = (file: UploadedFile) => {
    setPreviewFile(file);
  };

  // Modal'ı kapatma fonksiyonu
  const handleClosePreview = () => {
    setPreviewFile(null);
  };
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // 1. Presign isteği at
      const presignedResult = await api.post(
        `/file/presignUpload${
          currentFolderId ? `?folderId=${currentFolderId}` : ""
        }`,
        {
          originalFileName: file.name,
          contentType: file.type,
          size: file.size,
        }
      );

      // 2. Dönen URL'ye PUT isteği yap
      await axios.put(presignedResult.data.url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      setNotification({ open: true, message: "File uploaded successfully!" });

      // 3. Dosya/folder listesini yenile
      setTimeout(async () => {
        await fetchMyFiles();
        await fetchFolders();
      }, 500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError("File upload failed: " + errorMessage);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/file/${fileId}/download`);
      const presignedUrl = response.data;

      // Fetch ile dosyayı blob olarak indir
      const fileResponse = await fetch(presignedUrl);

      if (!fileResponse.ok) {
        throw new Error("Download failed");
      }

      const blob = await fileResponse.blob();

      // Blob'u indirilebilir link olarak oluştur
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName; // download attribute ZORUNLU
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setNotification({ open: true, message: "File downloaded successfully!" });
    } catch (err: any) {
      console.error("Download error:", err);
      setError("File download failed. You may not have permission.");
    }
  };

  const handleCreateFolder = async (name: string, parentFolderId?: string) => {
    setCreateFolderLoading(true);
    setCreateFolderError(null);
    try {
      await api.post("/folder/createFolders", {
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
      await api.post("/file/share", {
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

  const handleOpenDeleteDialog = (
    id: string,
    name: string,
    type: "file" | "folder"
  ) => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleOpenRenameDialog = (folder: Folder) => {
    setFolderToRename(folder);
    setRenameValue(folder.name);
    setRenameError(null);
    setRenameDialogOpen(true);
    closeActionsMenu();
  };

  const handleConfirmRename = async () => {
    if (!folderToRename) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return setRenameError("Name cannot be empty");

    setRenameLoading(true);
    setRenameError(null);
    try {
      const response = await api.put(
        `/folder/${folderToRename.id}/changeName`,
        { name: trimmed }
      );

      setNotification({ open: true, message: "Folder renamed successfully!" });

      // Update folder list in-place so folder doesn't move
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderToRename.id ? { ...f, name: trimmed } : f
        )
      );

      // If the renamed folder is in history, update its name there
      setFolderHistory((prev) =>
        prev.map((f) =>
          f.id === folderToRename.id ? { ...f, name: trimmed } : f
        )
      );

      setRenameDialogOpen(false);
      setFolderToRename(null);
    } catch (err: any) {
      setRenameError(err.response?.data?.message || "Failed to rename folder.");
      console.error("Rename error:", err);
    } finally {
      setRenameLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      if (itemToDelete.type === "file") {
        await api.delete(`/file/${itemToDelete.id}`);
        setNotification({
          open: true,
          message: "File deleted successfully!",
        });
        fetchMyFiles(); // Refresh the file list to show the change
      } else {
        await api.delete(`/folder/${itemToDelete.id}`);
        setNotification({
          open: true,
          message: "Folder deleted successfully!",
        });

        // Eğer silinen klasörün içindeysek, üst klasöre dön
        if (currentFolderId === itemToDelete.id) {
          handleBackClick();
        }

        fetchFolders();
        fetchMyFiles();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || `Failed to delete ${itemToDelete.type}.`
      );
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null); // Clear the item
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

  const handleCreatePublicLink = async (
    expirationHours: number
  ): Promise<string> => {
    if (!selectedFile) throw new Error("No file selected");

    setPublicLinkLoading(true);
    setPublicLinkError(null);

    try {
      const response = await api.post(
        `/file/${selectedFile.id}/createPublicLink`,
        {
          expirationHours: expirationHours, // Backend'in beklediği DTO'ya uygun olarak
        }
      );
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
                  {/* Durum 1: Gösterilecek hiçbir şey yoksa (ne klasör ne de dosya) */}
                  {folders.length === 0 && currentFolderFiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="subtitle1" sx={{ p: 3 }}>
                          {currentFolderId
                            ? "This folder is empty. Upload files or create subfolders!"
                            : "No files or folders found. Upload your first file or create a folder!"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Durum 2: Klasörleri render et */}
                  {folders.map((folder) => (
                    <TableRow
                      key={folder.id}
                      hover
                      onDoubleClick={() => handleFolderDoubleClick(folder)} // Klasörlere çift tıklanır
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
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <FolderIcon sx={{ mr: 1, color: "primary.main" }} />
                          <Typography
                            className="folder-name"
                            variant="body1"
                            sx={{ transition: "color 0.2s" }}
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
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // Satırın onDoubleClick olayını engelle
                              openActionsMenu(e, {
                                id: folder.id,
                                type: "folder",
                                folder,
                              });
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Durum 3: Dosyaları render et */}
                  {currentFolderFiles.map((file) => (
                    <TableRow
                      key={file.id}
                      hover
                      onClick={() => handleFileClick(file)} // Dosyalara önizleme için tek tıklanır
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <FileIcon sx={{ mr: 1, color: "text.secondary" }} />
                          {file.originalFileName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label="File" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{filesize(file.size)}</TableCell>
                      <TableCell align="right">
                        {format(new Date(file.uploadedAt), "Pp")}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // Satırın onClick olayını engelle
                              openActionsMenu(e, {
                                id: file.id,
                                type: "file",
                                file,
                              });
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* YENİ ÖNİZLEME MODALI */}
      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onClose={handleClosePreview}
      />
      {/* Share Dialog */}
      {selectedFile && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={handleCloseShareDialog}
          onShare={handleShareFile}
          onCreatePublicLink={handleCreatePublicLink} // Güncellenmiş fonksiyonu prop olarak geç
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
      {itemToDelete && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={itemToDelete.name}
          itemType={itemToDelete.type}
          loading={deleteLoading}
        />
      )}
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
      />

      {/* Actions Menu (single instance used for files and folders) */}
      {/* Actions Menu (single instance used for files and folders) */}
      <Menu
        id="actions-menu"
        anchorEl={actionsAnchorEl}
        open={Boolean(actionsAnchorEl)}
        onClose={closeActionsMenu}
        onClick={(e) => e.stopPropagation()}
      >
        {actionsTarget?.type === "file"
          ? [
              <MenuItem
                key="share"
                onClick={() => {
                  if (actionsTarget?.file)
                    handleOpenShareDialog(actionsTarget.file);
                  closeActionsMenu();
                }}
              >
                <ListItemIcon>
                  <ShareIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Share</ListItemText>
              </MenuItem>,
              <MenuItem
                key="download"
                onClick={() => {
                  if (actionsTarget?.id && actionsTarget?.file)
                    handleFileDownload(
                      actionsTarget.id,
                      actionsTarget.file.originalFileName
                    );
                  closeActionsMenu();
                }}
              >
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download</ListItemText>
              </MenuItem>,
              <MenuItem
                key="delete"
                onClick={() => {
                  if (actionsTarget?.id && actionsTarget?.file)
                    handleOpenDeleteDialog(
                      actionsTarget.id,
                      actionsTarget.file.originalFileName,
                      "file"
                    );
                  closeActionsMenu();
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>,
            ]
          : [
              <MenuItem
                key="rename"
                onClick={() => {
                  if (actionsTarget?.folder)
                    handleOpenRenameDialog(actionsTarget.folder);
                  closeActionsMenu();
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Rename</ListItemText>
              </MenuItem>,
              <MenuItem
                key="delete"
                onClick={() => {
                  if (actionsTarget?.id && actionsTarget?.folder)
                    handleOpenDeleteDialog(
                      actionsTarget.id,
                      actionsTarget.folder.name,
                      "folder"
                    );
                  closeActionsMenu();
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>,
            ]}
      </Menu>

      {/* Rename Folder Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          {renameError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {renameError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="renameFolderName"
            label="New Folder Name"
            type="text"
            fullWidth
            variant="outlined"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && renameValue.trim()) {
                handleConfirmRename();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmRename}
            disabled={renameLoading || !renameValue.trim()}
          >
            {renameLoading ? <CircularProgress size={24} /> : "Rename"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardPage;
