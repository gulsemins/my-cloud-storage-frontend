// .\src\components\FilePreviewModal.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Link,
} from "@mui/material";
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import type { UploadedFile } from "../types";
import api from "../services/api";
// .\src\components\FilePreviewModal.tsx

// ... importlar ve interface tanımı aynı

interface FilePreviewModalProps {
  file: UploadedFile | null;
  open: boolean;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  open,
  onClose,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sadece component açıldığında ve dosya değiştiğinde URL'i çek
    if (file && open) {
      const fetchPreviewUrl = async () => {
        setLoading(true);
        setError(null);
        setPreviewUrl(null); // Önceki URL'i temizle
        try {
          const response = await api.get<string>(`/file/${file.id}/download`);
          setPreviewUrl(response.data);
        } catch (err) {
          setError(
            "Could not load file preview. You may not have permission or the file is unavailable."
          );
          console.error("Preview fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPreviewUrl();
    } else {
      // Modal kapandığında state'i sıfırla
      setPreviewUrl(null);
      setError(null);
      setLoading(false);
    }
  }, [file, open]); // useEffect'in bağımlılıkları doğru

  // Render mantığını component'in ana gövdesine taşıyalım
  let content: React.ReactNode;

  if (loading) {
    content = (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    content = <Alert severity="error">{error}</Alert>;
  } else if (previewUrl && file?.contentType) {
    // URL ve contentType varsa, içeriği oluştur
    if (file.contentType.startsWith("image/")) {
      content = (
        <img
          src={previewUrl}
          alt={file.originalFileName}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            display: "block",
            margin: "auto",
          }}
        />
      );
    } else if (file.contentType === "application/pdf") {
      content = (
        <iframe
          src={previewUrl}
          title={file.originalFileName}
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      );
    } else if (file.contentType.startsWith("video/")) {
      content = (
        <video
          src={previewUrl}
          controls
          style={{ maxWidth: "100%", maxHeight: "80vh" }}
        />
      );
    } else if (file.contentType.startsWith("audio/")) {
      content = (
        <audio
          src={previewUrl}
          controls
          style={{ width: "100%", marginTop: "20px" }}
        />
      );
    } else {
      // Desteklenmeyen dosyalar için
      content = (
        <Box sx={{ textAlign: "center", p: 4 }}>
          <FileIcon sx={{ fontSize: 80, color: "text.secondary" }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preview is not available for this file type.
          </Typography>
          <Typography color="text.secondary">({file.contentType})</Typography>
          <Link
            href={previewUrl}
            target="_blank"
            rel="noopener"
            sx={{ mt: 2, display: "inline-block" }}
          >
            Download "{file.originalFileName}" instead
          </Link>
        </Box>
      );
    }
  } else if (open && !loading) {
    // Yükleme bitti ama URL veya contentType yoksa
    content = (
      <Alert severity="warning">Could not prepare the file for preview.</Alert>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file?.originalFileName}
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{content}</DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
