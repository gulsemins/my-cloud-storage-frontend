// src/components/GridItemThumbnail.tsx

import React, { useState, useEffect } from "react";
import { Box, Skeleton, Icon } from "@mui/material";
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocIcon,
  Slideshow as PptIcon,
  FolderZip as ZipIcon,
} from "@mui/icons-material";
import type { UploadedFile } from "../types";
import api from "../services/api";

interface GridItemThumbnailProps {
  file: UploadedFile;
}

const GridItemThumbnail: React.FC<GridItemThumbnailProps> = ({ file }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sadece dosya bir resim ise URL'i çekmeye çalış
    if (file && file.contentType?.startsWith("image/")) {
      setLoading(true);

      const fetchThumbnailUrl = async () => {
        try {
          const response = await api.get<string>(`/file/${file.id}/download`);
          setThumbnailUrl(response.data);
        } catch (error) {
          console.error(
            "Could not fetch thumbnail for file:",
            file.originalFileName,
            error
          );
          // Hata olursa URL'i null bırakarak genel ikonu göstermesini sağlarız.
          setThumbnailUrl(null);
        } finally {
          setLoading(false);
        }
      };

      fetchThumbnailUrl();
    } else {
      // Eğer dosya resim değilse, yüklemeyi direkt bitir
      setLoading(false);
    }
  }, [file]); // Sadece 'file' prop'u değiştiğinde çalışır
  // --- YENİ İKON SEÇME FONKSİYONU BAŞLIYOR ---
  const renderIcon = () => {
    const type = file.contentType || "";
    const sxProps = { fontSize: 60, color: "text.secondary" };

    if (type.includes("pdf"))
      return <PdfIcon sx={{ ...sxProps, color: "#f44336" }} />;
    if (type.startsWith("video/"))
      return <VideoIcon sx={{ ...sxProps, color: "#2196f3" }} />;
    if (type.startsWith("audio/"))
      return <AudioIcon sx={{ ...sxProps, color: "#ff9800" }} />;
    if (type.includes("presentation") || type.includes("powerpoint"))
      return <PptIcon sx={{ ...sxProps, color: "#d32f2f" }} />;
    if (type.includes("document") || type.includes("word"))
      return <DocIcon sx={{ ...sxProps, color: "#2962ff" }} />;
    if (type.includes("zip") || type.includes("archive"))
      return <ZipIcon sx={sxProps} />;

    // Hiçbirine uymuyorsa, genel dosya ikonunu göster
    return <FileIcon sx={sxProps} />;
  };
  // --- YENİ İKON SEÇME FONKSİYONU BİTİYOR ---
  // Yükleniyorsa, bir iskelet (skeleton) animasyonu göster
  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height="100%" />;
  }

  // Yüklendi ve thumbnail URL'i varsa (yani dosya bir resimse), resmi göster
  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={file.originalFileName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // Resmin kutuya sığmasını ve orantılı kalmasını sağlar
        }}
      />
    );
  }

  // Eğer dosya resim değilse veya thumbnail yüklenemediyse, genel dosya ikonunu göster
  return renderIcon();
};

export default GridItemThumbnail;
//test
