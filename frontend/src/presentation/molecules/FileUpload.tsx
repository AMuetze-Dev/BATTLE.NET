/**
 * File Upload component - Upload question catalogs
 */
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Button, Icon } from '../atoms';
import { colors, spacing, borderRadius, transitions } from '../../theme';

export interface FileUploadProps {
	onFileSelect: (file: File) => void;
	onUpload?: () => void;
	accept?: string;
	maxSize?: number; // in MB
	loading?: boolean;
	error?: string;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const DropZone = styled.div<{ isDragging: boolean; hasFile: boolean }>`
	border: 2px dashed ${({ isDragging, hasFile }) => (isDragging ? colors.primary[500] : hasFile ? colors.primary[500] : colors.border.medium)};
	border-radius: ${borderRadius.lg};
	padding: ${spacing['2xl']};
	text-align: center;
	cursor: pointer;
	transition: all ${transitions.fast};
	background: ${({ isDragging }) => (isDragging ? colors.primary[50] : colors.surface)};

	&:hover {
		border-color: ${colors.primary[400]};
		background: ${colors.primary[50]};
	}
`;

const DropZoneIcon = styled.div`
	font-size: 48px;
	margin-bottom: ${spacing.md};
`;

const DropZoneText = styled.p`
	margin: 0;
	color: ${colors.text.secondary};
	font-size: 14px;
`;

const DropZoneHint = styled.p`
	margin: ${spacing.xs} 0 0 0;
	color: ${colors.text.disabled};
	font-size: 12px;
`;

const FileInfo = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${spacing.md};
	background: ${colors.primary[50]};
	border: 1px solid ${colors.primary[300]};
	border-radius: ${borderRadius.md};
`;

const FileName = styled.span`
	font-weight: 500;
	color: ${colors.text.primary};
`;

const FileSize = styled.span`
	color: ${colors.text.secondary};
	font-size: 12px;
	margin-left: ${spacing.sm};
`;

const ErrorMessage = styled.div`
	padding: ${spacing.md};
	background: ${colors.error[50]};
	border: 1px solid ${colors.error[300]};
	border-radius: ${borderRadius.md};
	color: ${colors.error[700]};
	font-size: 14px;
`;

const Actions = styled.div`
	display: flex;
	gap: ${spacing.md};
`;

const HiddenInput = styled.input`
	display: none;
`;

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

export const FileUpload: React.FC<FileUploadProps> = ({
	onFileSelect,
	onUpload,
	accept = '.zip',
	maxSize = 50, // 50 MB default
	loading = false,
	error,
}) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [localError, setLocalError] = useState<string>('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): boolean => {
		setLocalError('');

		// Check file type
		if (accept && !accept.split(',').some((ext) => file.name.toLowerCase().endsWith(ext.trim()))) {
			setLocalError(`Invalid file type. Expected: ${accept}`);
			return false;
		}

		// Check file size
		const maxBytes = maxSize * 1024 * 1024;
		if (file.size > maxBytes) {
			setLocalError(`File too large. Maximum size: ${maxSize}MB`);
			return false;
		}

		return true;
	};

	const handleFileSelect = (file: File) => {
		if (validateFile(file)) {
			setSelectedFile(file);
			onFileSelect(file);
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);

		const file = event.dataTransfer.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleClear = () => {
		setSelectedFile(null);
		setLocalError('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const displayError = error || localError;

	return (
		<Container>
			<DropZone isDragging={isDragging} hasFile={!!selectedFile} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick}>
				{selectedFile ? <Icon name="check-circle" size="xl" color="success" /> : <Icon name="folder" size="xl" color="primary" />}
				<DropZoneText>{selectedFile ? 'File selected! Click to change or drag another file' : 'Click to select or drag and drop a file'}</DropZoneText>
				<DropZoneHint>
					Accepted: {accept} • Max size: {maxSize}MB
				</DropZoneHint>
			</DropZone>

			<HiddenInput ref={fileInputRef} type="file" accept={accept} onChange={handleInputChange} />

			{selectedFile && (
				<FileInfo>
					<div>
						<FileName>{selectedFile.name}</FileName>
						<FileSize>{formatFileSize(selectedFile.size)}</FileSize>
					</div>
				</FileInfo>
			)}

			{displayError && <ErrorMessage>{displayError}</ErrorMessage>}

			{selectedFile && onUpload && (
				<Actions>
					<Button variant="primary" fullWidth onClick={onUpload} loading={loading} disabled={loading}>
						{loading ? 'Uploading...' : 'Upload Questions'}
					</Button>
					<Button variant="outline" onClick={handleClear} disabled={loading}>
						Clear
					</Button>
				</Actions>
			)}
		</Container>
	);
};
