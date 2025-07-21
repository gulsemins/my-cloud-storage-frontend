import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Button, CircularProgress, Alert, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, AppBar, Toolbar, Snackbar
} from '@mui/material';
import { UploadFile as UploadFileIcon, Download as DownloadIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { filesize } from 'filesize';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { UploadedFile } from '../types';

const DashboardPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '' });
  const { logout } = useAuth();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UploadedFile[]>('/files');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to fetch files.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    try {
      await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNotification({ open: true, message: 'File uploaded successfully!' });
      fetchFiles(); // Refresh the file list
    } catch (err) {
      setError('File upload failed.');
      console.error(err);
    } finally {
      setUploading(false);
      // Reset file input value to allow uploading the same file again
      event.target.value = '';
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/${fileId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('File download failed.');
      console.error(err);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Cloud Storage
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Your Files
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" hidden onChange={handleFileUpload} />
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Upload Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="subtitle1" sx={{ p: 3 }}>No files found. Upload your first file!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell component="th" scope="row">
                        {file.originalFileName}
                      </TableCell>
                      <TableCell align="right">{filesize(file.size)}</TableCell>
                      <TableCell align="right">{format(new Date(file.uploadedAt), 'Pp')}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleFileDownload(file.id, file.originalFileName)}
                        >
                          <DownloadIcon />
                        </IconButton>
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
