import { useState } from 'react';
import { Paper, TextField, Box } from '@mui/material';
import type { Card } from '../models/Card';

interface CardItemProps {
    card: Card;
    onDragStart: (cardId: string) => void;
    onUpdate: (cardId: string, title: string, details: string) => void;
}

export default function CardItem({ card, onDragStart, onUpdate }: CardItemProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editTitle, setEditTitle] = useState(card.title);
    const [editDetails, setEditDetails] = useState(card.details);

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
            onUpdate(card.id, editTitle, card.details);
            setIsEditingTitle(false);
        }
    };

    const handleDetailsSave = () => {
        onUpdate(card.id, card.title, editDetails);
        setIsEditingDetails(false);
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

    return (
        <Paper
            draggable={!isEditingTitle && !isEditingDetails}
            onDragStart={() => onDragStart(card.id)}
            sx={{
                padding: '0.75em',
                marginBottom: '0.75em',
                backgroundColor: 'white',
                cursor: isEditingTitle || isEditingDetails ? 'default' : 'grab',
                '&:active': {
                    cursor: isEditingTitle || isEditingDetails ? 'default' : 'grabbing'
                },
                '&:hover': {
                    boxShadow: 3
                }
            }}
        >
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
                            transition: 'background-color 0.2s'
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
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '0.9em',
                                    padding: '4px'
                                }
                            }}
                        />
                    ) : (
                        <div
                            onClick={handleDetailsClick}
                            style={{
                                fontSize: '0.9em',
                                color: '#666',
                                cursor: 'text',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s'
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
        </Paper>
    );
}
