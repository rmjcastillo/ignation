import { useState, useEffect, useRef } from 'react';
import { Button, TextField, Box, Paper } from '@mui/material';
import type { Board } from '../models/Board';
import type { Card } from '../models/Card';
import CardItem from './CardItem';

const BOARDS_STORAGE_KEY = 'kanban_boards';
const CARDS_STORAGE_KEY = 'kanban_cards';

interface BoardListProps {
    workspaceId: number;
}

export default function BoardList({ workspaceId }: BoardListProps) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const [boardTitle, setBoardTitle] = useState('');
    const [creatingCardForBoard, setCreatingCardForBoard] = useState<string | null>(null);
    const [cardTitle, setCardTitle] = useState('');
    const [cardDetails, setCardDetails] = useState('');
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
    const currentWorkspaceRef = useRef(workspaceId);
    const isLoadingRef = useRef(false);

    // Helper function to save boards to localStorage
    const saveBoardsToStorage = (boardsToSave: Board[], wsId: string) => {
        const saved = localStorage.getItem(BOARDS_STORAGE_KEY);
        const allBoards = saved ? JSON.parse(saved) : [];
        const otherBoards = allBoards.filter((board: Board) => board.workspaceId !== wsId);
        localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify([...otherBoards, ...boardsToSave]));
    };

    // Helper function to save cards to localStorage
    const saveCardsToStorage = (cardsToSave: Card[], wsId: string) => {
        const saved = localStorage.getItem(CARDS_STORAGE_KEY);
        const allCards = saved ? JSON.parse(saved) : [];
        const otherCards = allCards.filter((card: Card) => card.workspaceId !== wsId);
        const serializedCards = cardsToSave.map(card => ({
            ...card,
            dateCreated: card.dateCreated?.toString(),
            dueDate: card.dueDate?.toString()
        }));
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify([...otherCards, ...serializedCards]));
    };

    // Load boards and cards when component mounts or workspace changes
    useEffect(() => {
        isLoadingRef.current = true;

        const savedBoards = localStorage.getItem(BOARDS_STORAGE_KEY);
        const allBoards = savedBoards ? JSON.parse(savedBoards) : [];
        const workspaceBoards = allBoards.filter((board: Board) => board.workspaceId === workspaceId.toString());

        const savedCards = localStorage.getItem(CARDS_STORAGE_KEY);
        const allCards = savedCards ? JSON.parse(savedCards) : [];
        const workspaceCards = allCards.filter((card: Card) => card.workspaceId === workspaceId.toString());

        setBoards(workspaceBoards);
        setCards(workspaceCards);
        currentWorkspaceRef.current = workspaceId;

        // Small timeout to ensure state is updated before we allow saving
        setTimeout(() => {
            isLoadingRef.current = false;
        }, 0);
    }, [workspaceId]);

    // Save boards to localStorage whenever they change (but not during loading)
    useEffect(() => {
        if (!isLoadingRef.current) {
            saveBoardsToStorage(boards, workspaceId.toString());
        }
    }, [boards]);

    // Save cards to localStorage whenever they change (but not during loading)
    useEffect(() => {
        if (!isLoadingRef.current) {
            saveCardsToStorage(cards, workspaceId.toString());
        }
    }, [cards]);

    const handleCreateBoard = () => {
        if (boardTitle.trim()) {
            const newBoard: Board = {
                id: `board-${Date.now()}`,
                workspaceId: workspaceId.toString(),
                title: boardTitle,
                description: '',
                order: boards.length + 1
            };
            setBoards([...boards, newBoard]);
            setBoardTitle('');
            setIsCreatingBoard(false);
        }
    };

    const handleCreateCard = (boardId: string) => {
        if (cardTitle.trim()) {
            const newCard: Card = {
                id: `card-${Date.now()}`,
                boardId: boardId,
                workspaceId: workspaceId.toString(),
                title: cardTitle,
                details: cardDetails,
                parentId: null,
                dateCreated: new Date(),
                dueDate: null
            };
            setCards([...cards, newCard]);
            setCardTitle('');
            setCardDetails('');
            setCreatingCardForBoard(null);
        }
    };

    const handleDragStart = (cardId: string) => {
        setDraggedCardId(cardId);
    };

    const handleUpdateCard = (cardId: string, title: string, details: string) => {
        setCards(cards.map(card =>
            card.id === cardId
                ? { ...card, title, details }
                : card
        ));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetBoardId: string) => {
        e.preventDefault();
        if (draggedCardId) {
            setCards(cards.map(card =>
                card.id === draggedCardId
                    ? { ...card, boardId: targetBoardId }
                    : card
            ));
            setDraggedCardId(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateBoard();
        } else if (e.key === 'Escape') {
            setBoardTitle('');
            setIsCreatingBoard(false);
        }
    };

    const handleCardKeyPress = (e: React.KeyboardEvent, boardId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreateCard(boardId);
        } else if (e.key === 'Escape') {
            setCardTitle('');
            setCardDetails('');
            setCreatingCardForBoard(null);
        }
    };

    const getCardsForBoard = (boardId: string) => {
        return cards.filter(card => card.boardId === boardId);
    };

    return (
        <Box>
            <Button
                variant="contained"
                onClick={() => setIsCreatingBoard(true)}
                sx={{ marginBottom: '1em' }}
            >
                Add Board
            </Button>

            {isCreatingBoard && (
                <Box sx={{ marginBottom: '1em', display: 'flex', gap: '0.5em' }}>
                    <TextField
                        autoFocus
                        size="small"
                        placeholder="Board title"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <Button variant="contained" size="small" onClick={handleCreateBoard}>
                        Save
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            setBoardTitle('');
                            setIsCreatingBoard(false);
                        }}
                    >
                        Cancel
                    </Button>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: '1.5em', overflowX: 'auto', paddingBottom: '2em' }}>
                {boards.map((board) => (
                    <Paper
                        key={board.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, board.id)}
                        sx={{
                            minWidth: '300px',
                            maxWidth: '300px',
                            padding: '1em',
                            backgroundColor: '#f5f5f5',
                            minHeight: '400px'
                        }}
                    >
                        <h3 style={{ margin: '0 0 1em 0' }}>{board.title}</h3>

                        <Box sx={{ marginBottom: '1em' }}>
                            {getCardsForBoard(board.id).map((card) => (
                                <CardItem
                                    key={card.id}
                                    card={card}
                                    onDragStart={handleDragStart}
                                    onUpdate={handleUpdateCard}
                                />
                            ))}
                        </Box>

                        {creatingCardForBoard === board.id ? (
                            <Box sx={{ marginTop: '1em' }}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    placeholder="Card title"
                                    value={cardTitle}
                                    onChange={(e) => setCardTitle(e.target.value)}
                                    onKeyDown={(e) => handleCardKeyPress(e, board.id)}
                                    sx={{ marginBottom: '0.5em', backgroundColor: 'white' }}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    placeholder="Details (optional)"
                                    value={cardDetails}
                                    onChange={(e) => setCardDetails(e.target.value)}
                                    onKeyDown={(e) => handleCardKeyPress(e, board.id)}
                                    sx={{ marginBottom: '0.5em', backgroundColor: 'white' }}
                                />
                                <Box sx={{ display: 'flex', gap: '0.5em' }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleCreateCard(board.id)}
                                    >
                                        Add Card
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setCardTitle('');
                                            setCardDetails('');
                                            setCreatingCardForBoard(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                onClick={() => setCreatingCardForBoard(board.id)}
                                sx={{ marginTop: '1em' }}
                            >
                                + Add Card
                            </Button>
                        )}
                    </Paper>
                ))}
            </Box>
        </Box>
    );
}
