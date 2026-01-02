import { useState, useEffect, useRef } from 'react';
import { Paper, TextField, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Card, CardStatus } from '../models/Card';

interface CardItemProps {
    card: Card;
    onDragStart: (cardId: string) => void;
    onUpdate: (cardId: string, title: string, details: string, status: CardStatus, customStatuses?: string[]) => void;
    onDropOnCard: (draggedCardId: string, targetCardId: string) => void;
    onDelete: (cardId: string) => void;
    depth?: number;
}

export default function CardItem({ card, onDragStart, onUpdate, onDropOnCard, onDelete, depth = 0 }: CardItemProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editTitle, setEditTitle] = useState(card.title);
    const [editDetails, setEditDetails] = useState(card.details);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isAddingCustomStatus, setIsAddingCustomStatus] = useState(false);
    const [newCustomStatus, setNewCustomStatus] = useState('');
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const customStatusInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusDropdownOpen]);

    const getStatusColor = (status: CardStatus): string => {
        switch (status) {
            case 'todo':
                return '#E3F2FD'; // Light blue
            case 'doing':
                return '#FFF3E0'; // Light amber
            case 'done':
                return '#E8F5E9'; // Light green
            case 'blocked':
                return '#FFEBEE'; // Light red
            default:
                return 'white'; // Default white
        }
    };

    const getStatusLabel = (status: CardStatus): string => {
        switch (status) {
            case 'todo':
                return 'To Do';
            case 'doing':
                return 'Doing';
            case 'done':
                return 'Done';
            case 'blocked':
                return 'Blocked';
            default:
                return 'Set Status';
        }
    };

    const getStatusPillColor = (status: CardStatus): string => {
        switch (status) {
            case 'todo':
                return '#1976d2'; // Blue
            case 'doing':
                return '#f57c00'; // Orange
            case 'done':
                return '#388e3c'; // Green
            case 'blocked':
                return '#d32f2f'; // Red
            default:
                return '#757575'; // Gray
        }
    };

    const handleTitleClick = () => {
        setIsEditingTitle(true);
        setEditTitle(card.title);
    };

    const handleDetailsClick = () => {
        setIsEditingDetails(true);
        setEditDetails(card.details);
    };

    const handleTitleSave = () => {
        if (editTitle.trim()) {
            onUpdate(card.id, editTitle, card.details, card.status, card.customStatuses);
            setIsEditingTitle(false);
        }
    };

    const handleDetailsSave = () => {
        onUpdate(card.id, card.title, editDetails, card.status, card.customStatuses);
        setIsEditingDetails(false);
    };

    const handleStatusChange = (newStatus: CardStatus) => {
        onUpdate(card.id, card.title, card.details, newStatus, card.customStatuses);
        setIsStatusDropdownOpen(false);
    };

    const handleAddCustomStatus = () => {
        const trimmedStatus = newCustomStatus.trim();
        if (trimmedStatus && (!card.customStatuses || card.customStatuses.length < 5)) {
            const updatedCustomStatuses = [...(card.customStatuses || []), trimmedStatus];
            onUpdate(card.id, card.title, card.details, card.status, updatedCustomStatuses);
            setNewCustomStatus('');
            setIsAddingCustomStatus(false);
        }
    };

    const handleRemoveCustomStatus = (index: number) => {
        const updatedCustomStatuses = [...(card.customStatuses || [])];
        updatedCustomStatuses.splice(index, 1);
        onUpdate(card.id, card.title, card.details, card.status, updatedCustomStatuses);
    };

    const handleCustomStatusKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomStatus();
        } else if (e.key === 'Escape') {
            setIsAddingCustomStatus(false);
            setNewCustomStatus('');
        }
    };

    const handleStatusPillClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsStatusDropdownOpen(!isStatusDropdownOpen);
    };

    const handleDetailsMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setEditTitle(card.title);
        }
    };

    const handleDetailsKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleDetailsSave();
        } else if (e.key === 'Escape') {
            setIsEditingDetails(false);
            setEditDetails(card.details);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const draggedCardId = e.dataTransfer.getData('cardId');
        if (draggedCardId && draggedCardId !== card.id) {
            onDropOnCard(draggedCardId, card.id);
        }
    };

    const handleDragStartInternal = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('cardId', card.id);
        onDragStart(card.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(card.id);
    };

    return (
        <Paper
            draggable={!isEditingTitle && !isEditingDetails}
            onDragStart={handleDragStartInternal}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                padding: '0.75em',
                paddingBottom: '6em',
                marginBottom: '0.75em',
                marginLeft: `${depth * 1.5}em`,
                backgroundColor: getStatusColor(card.status),
                cursor: isEditingTitle || isEditingDetails ? 'default' : 'grab',
                border: isDragOver ? '2px solid #1976d2' : '1px solid transparent',
                transition: 'border 0.2s, background-color 0.2s',
                position: 'relative',
                minHeight: '120px',
                maxHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                '&:active': {
                    cursor: isEditingTitle || isEditingDetails ? 'default' : 'grabbing'
                },
                '&:hover': {
                    boxShadow: 3
                }
            }}
        >
            {isHovered && !isEditingTitle && !isEditingDetails && (
                <IconButton
                    onClick={handleDelete}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        padding: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                            backgroundColor: '#ffebee',
                            color: '#d32f2f'
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}

            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 0
            }}>
                <Box sx={{ marginBottom: card.details ? '0.5em' : 0 }}>
                {isEditingTitle ? (
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        inputProps={{ maxLength: 50 }}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontWeight: 'bold',
                                padding: '4px'
                            }
                        }}
                    />
                ) : (
                    <div
                        onClick={handleTitleClick}
                        style={{
                            fontWeight: 'bold',
                            cursor: 'text',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {card.title}
                    </div>
                )}
                </Box>

                {(card.details || isEditingDetails) && (
                    <Box>
                        {isEditingDetails ? (
                            <>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={editDetails}
                                    onChange={(e) => setEditDetails(e.target.value)}
                                    onBlur={handleDetailsSave}
                                    onKeyDown={handleDetailsKeyDown}
                                    placeholder="Add details..."
                                    inputProps={{ maxLength: 300 }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '0.9em',
                                            padding: '4px'
                                        }
                                    }}
                                />
                                <Box
                                    sx={{
                                        fontSize: '0.75em',
                                        color: editDetails.length >= 300 ? '#d32f2f' : '#999',
                                        textAlign: 'right',
                                        marginTop: '4px'
                                    }}
                                >
                                    {editDetails.length}/300 characters
                                </Box>
                            </>
                        ) : (
                            <div
                                ref={detailsRef}
                                onClick={handleDetailsClick}
                                onMouseDown={handleDetailsMouseDown}
                                style={{
                                    fontSize: '0.9em',
                                    color: '#666',
                                    cursor: 'text',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    wordWrap: 'break-word'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                {card.details || 'Add details...'}
                            </div>
                        )}
                    </Box>
                )}

                {!card.details && !isEditingDetails && (
                    <div
                        onClick={handleDetailsClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            fontSize: '0.9em',
                            color: '#999',
                            cursor: 'text',
                            padding: '4px',
                            borderRadius: '4px',
                            fontStyle: 'italic',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Add details...
                    </div>
                )}
            </Box>

            <Box sx={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                {/* Custom Status Pills */}
                {card.customStatuses && card.customStatuses.map((customStatus, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#9e9e9e',
                            color: 'white',
                            fontSize: '0.7em',
                            fontWeight: 'bold',
                            cursor: 'default',
                            '& .delete-icon': {
                                opacity: 0,
                                transition: 'opacity 0.2s'
                            },
                            '&:hover .delete-icon': {
                                opacity: 1
                            }
                        }}
                    >
                        <span>{customStatus}</span>
                        <CloseIcon
                            className="delete-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomStatus(index);
                            }}
                            sx={{
                                fontSize: '0.9em',
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.7
                                }
                            }}
                        />
                    </Box>
                ))}

                {/* Add Custom Status Button/Input */}
                {(!card.customStatuses || card.customStatuses.length < 5) && (
                    <>
                        {isAddingCustomStatus ? (
                            <TextField
                                inputRef={customStatusInputRef}
                                autoFocus
                                size="small"
                                value={newCustomStatus}
                                onChange={(e) => setNewCustomStatus(e.target.value)}
                                onBlur={handleAddCustomStatus}
                                onKeyDown={handleCustomStatusKeyDown}
                                placeholder="Status name"
                                inputProps={{ maxLength: 10 }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontSize: '0.7em',
                                        height: '24px'
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '4px 8px'
                                    },
                                    width: '80px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddingCustomStatus(true);
                                }}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#e0e0e0',
                                    color: '#666',
                                    fontSize: '1em',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    '&:hover': {
                                        backgroundColor: '#bdbdbd'
                                    }
                                }}
                            >
                                +
                            </Box>
                        )}
                    </>
                )}

                {/* Main Status Pill */}
                <Box ref={statusDropdownRef}>
                    <Box
                        onClick={handleStatusPillClick}
                        sx={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: getStatusPillColor(card.status),
                            color: 'white',
                            fontSize: '0.75em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            '&:hover': {
                                opacity: 0.8
                            }
                        }}
                    >
                        {getStatusLabel(card.status)}
                    </Box>

                    {isStatusDropdownOpen && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                marginBottom: '4px',
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '120px'
                            }}
                        >
                            {['', 'todo', 'doing', 'done', 'blocked'].map((status) => (
                                <Box
                                    key={status}
                                    onClick={() => handleStatusChange(status as CardStatus)}
                                    sx={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '0.85em',
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5'
                                        },
                                        borderBottom: status === 'blocked' ? 'none' : '1px solid #eee'
                                    }}
                                >
                                    {status === '' ? 'None' : getStatusLabel(status as CardStatus)}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}
