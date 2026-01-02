import { useState, useEffect, useRef } from 'react';
import { Button, TextField, Box, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Board } from '../models/Board';
import type { Card, CardStatus } from '../models/Card';
import CardItem from './CardItem';

const BOARDS_STORAGE_KEY = 'kanban_boards';
const CARDS_STORAGE_KEY = 'kanban_cards';

interface BoardListProps {
    workspaceId: number;
}

export default function BoardList({ workspaceId }: BoardListProps) {
    const [boards, setBoards] = useState<Board[]>(() => {
        const saved = localStorage.getItem(BOARDS_STORAGE_KEY);
        const allBoards = saved ? JSON.parse(saved) : [];
        return allBoards
            .filter((board: Board) => board.workspaceId === workspaceId.toString())
            .sort((a: Board, b: Board) => a.order - b.order);
    });
    const [cards, setCards] = useState<Card[]>([]);
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const [boardTitle, setBoardTitle] = useState('');
    const [boardColor, setBoardColor] = useState('#f5f5f5');
    const [creatingCardForBoard, setCreatingCardForBoard] = useState<string | null>(null);
    const [cardTitle, setCardTitle] = useState('');
    const [cardDetails, setCardDetails] = useState('');
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const [deleteBoardConfirmOpen, setDeleteBoardConfirmOpen] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
    const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [editingBoardTitle, setEditingBoardTitle] = useState('');
    const [draggedBoardId, setDraggedBoardId] = useState<string | null>(null);
    const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);
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
        const workspaceBoards = allBoards
            .filter((board: Board) => board.workspaceId === workspaceId.toString())
            .sort((a: Board, b: Board) => a.order - b.order);

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
                order: boards.length + 1,
                color: boardColor
            };
            setBoards([...boards, newBoard]);
            setBoardTitle('');
            setBoardColor('#f5f5f5');
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
                dueDate: null,
                status: '',
                isMinimized: true
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

    const handleUpdateCard = (cardId: string, title: string, details: string, status: CardStatus, customStatuses?: string[], isMinimized?: boolean, dueDate?: Date | null) => {
        setCards(cards.map(card =>
            card.id === cardId
                ? { ...card, title, details, status, customStatuses, isMinimized, dueDate }
                : card
        ));
    };

    const getAllDescendants = (cardId: string): string[] => {
        const descendants: string[] = [];
        const children = cards.filter(card => card.parentId === cardId);

        children.forEach(child => {
            descendants.push(child.id);
            descendants.push(...getAllDescendants(child.id));
        });

        return descendants;
    };

    const handleDeleteCard = (cardId: string) => {
        const descendants = getAllDescendants(cardId);

        if (descendants.length > 0) {
            setCardToDelete(cardId);
            setDeleteConfirmOpen(true);
        } else {
            confirmDelete(cardId);
        }
    };

    const confirmDelete = (cardId: string) => {
        const descendants = getAllDescendants(cardId);
        const idsToDelete = [cardId, ...descendants];

        setCards(cards.filter(card => !idsToDelete.includes(card.id)));
        setDeleteConfirmOpen(false);
        setCardToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteConfirmOpen(false);
        setCardToDelete(null);
    };

    const handleDeleteBoard = (boardId: string) => {
        const boardCards = cards.filter(card => card.boardId === boardId);

        if (boardCards.length > 0) {
            setBoardToDelete(boardId);
            setDeleteBoardConfirmOpen(true);
        } else {
            confirmDeleteBoard(boardId);
        }
    };

    const confirmDeleteBoard = (boardId: string) => {
        setBoards(boards.filter(board => board.id !== boardId));
        setCards(cards.filter(card => card.boardId !== boardId));
        setDeleteBoardConfirmOpen(false);
        setBoardToDelete(null);
    };

    const cancelDeleteBoard = () => {
        setDeleteBoardConfirmOpen(false);
        setBoardToDelete(null);
    };

    const handleBoardTitleClick = (board: Board) => {
        setEditingBoardId(board.id);
        setEditingBoardTitle(board.title);
    };

    const handleSaveBoardTitle = () => {
        if (editingBoardTitle.trim() && editingBoardId) {
            setBoards(boards.map(board =>
                board.id === editingBoardId
                    ? { ...board, title: editingBoardTitle }
                    : board
            ));
            setEditingBoardId(null);
            setEditingBoardTitle('');
        }
    };

    const handleCancelBoardEdit = () => {
        setEditingBoardId(null);
        setEditingBoardTitle('');
    };

    const handleBoardTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveBoardTitle();
        } else if (e.key === 'Escape') {
            handleCancelBoardEdit();
        }
    };

    const handleBoardDragStart = (e: React.DragEvent, boardId: string) => {
        setDraggedBoardId(boardId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleBoardDragEnd = () => {
        setDraggedBoardId(null);
        setDragOverBoardId(null);
    };

    const handleBoardDragOver = (e: React.DragEvent, boardId: string) => {
        // Only show board drop indicator if we're dragging a board
        if (draggedBoardId && draggedBoardId !== boardId) {
            e.preventDefault();
            setDragOverBoardId(boardId);
        }
    };

    const handleBoardDrop = (e: React.DragEvent, targetBoardId: string) => {
        // Only process if we're actually dragging a board (not a card)
        if (!draggedBoardId) {
            return;
        }

        e.preventDefault();

        if (draggedBoardId === targetBoardId) {
            setDragOverBoardId(null);
            return;
        }

        const draggedIndex = boards.findIndex(b => b.id === draggedBoardId);
        const targetIndex = boards.findIndex(b => b.id === targetBoardId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newBoards = [...boards];
        const [draggedBoard] = newBoards.splice(draggedIndex, 1);
        newBoards.splice(targetIndex, 0, draggedBoard);

        // Update order property for all boards
        const reorderedBoards = newBoards.map((board, index) => ({
            ...board,
            order: index + 1
        }));

        setBoards(reorderedBoards);
        setDragOverBoardId(null);
    };

    const handleDropOnCard = (draggedCardId: string, targetCardId: string) => {
        // Prevent dropping a card on its own descendant
        const descendants = getAllDescendants(draggedCardId);
        if (descendants.includes(targetCardId)) {
            return;
        }

        setCards(cards.map(card =>
            card.id === draggedCardId
                ? { ...card, parentId: targetCardId }
                : card
        ));
        setDraggedCardId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetBoardId: string) => {
        e.preventDefault();
        if (draggedCardId) {
            const descendantIds = getAllDescendants(draggedCardId);

            setCards(cards.map(card => {
                if (card.id === draggedCardId) {
                    return { ...card, boardId: targetBoardId, parentId: null };
                } else if (descendantIds.includes(card.id)) {
                    return { ...card, boardId: targetBoardId };
                }
                return card;
            }));
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
        return cards.filter(card => card.boardId === boardId && !card.parentId);
    };

    const getChildCards = (parentId: string) => {
        return cards.filter(card => card.parentId === parentId);
    };

    const renderCardWithChildren = (card: Card, depth: number = 0) => {
        const children = getChildCards(card.id);
        const elements = [
            <CardItem
                key={card.id}
                card={card}
                onDragStart={handleDragStart}
                onUpdate={handleUpdateCard}
                onDropOnCard={handleDropOnCard}
                onDelete={handleDeleteCard}
                depth={depth}
            />
        ];

        children.forEach(child => {
            elements.push(...renderCardWithChildren(child, depth + 1));
        });

        return elements;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1em' }}>
                <Button
                    variant="contained"
                    onClick={() => setIsCreatingBoard(true)}
                >
                    Add Board
                </Button>
            </Box>


            <Box sx={{ display: 'flex', gap: '1.5em', overflowX: 'auto', paddingBottom: '2em', alignItems: 'flex-start' }}>
                {boards.map((board) => (
                    <Paper
                        key={board.id}
                        draggable={!editingBoardId}
                        onDragStart={(e) => handleBoardDragStart(e, board.id)}
                        onDragEnd={handleBoardDragEnd}
                        onDragOver={(e) => {
                            handleDragOver(e);
                            handleBoardDragOver(e, board.id);
                        }}
                        onDrop={(e) => {
                            handleBoardDrop(e, board.id);
                            handleDrop(e, board.id);
                        }}
                        onMouseEnter={() => setHoveredBoardId(board.id)}
                        onMouseLeave={() => setHoveredBoardId(null)}
                        sx={{
                            minWidth: '300px',
                            maxWidth: '300px',
                            padding: '1em',
                            backgroundColor: board.color || '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            cursor: editingBoardId ? 'default' : 'move',
                            opacity: draggedBoardId === board.id ? 0.5 : 1,
                            border: dragOverBoardId === board.id ? '2px solid #1976d2' : '2px solid transparent',
                            transition: 'opacity 0.2s, border 0.2s'
                        }}
                    >
                        <Box sx={{ position: 'relative', marginBottom: '1em' }}>
                            {editingBoardId === board.id ? (
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    value={editingBoardTitle}
                                    onChange={(e) => setEditingBoardTitle(e.target.value)}
                                    onBlur={handleSaveBoardTitle}
                                    onKeyDown={handleBoardTitleKeyDown}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.17em',
                                            fontWeight: 'bold',
                                            padding: '8px'
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    <h3
                                        onClick={() => handleBoardTitleClick(board)}
                                        style={{
                                            margin: 0,
                                            paddingRight: hoveredBoardId === board.id ? '32px' : '0',
                                            cursor: 'text',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s',
                                            backgroundColor: 'transparent'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {board.title}
                                    </h3>
                                    {hoveredBoardId === board.id && !editingBoardId && (
                                        <IconButton
                                            onClick={() => handleDeleteBoard(board.id)}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '-4px',
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
                                </>
                            )}
                        </Box>

                        <Box sx={{ marginBottom: '1em', flex: '1 1 auto' }}>
                            {getCardsForBoard(board.id).flatMap((card) =>
                                renderCardWithChildren(card, 0)
                            )}
                        </Box>

                        {creatingCardForBoard === board.id ? (
                            <Box sx={{ marginTop: '1em', flex: '0 0 auto' }}>
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
                                sx={{ marginTop: '1em', flex: '0 0 auto' }}
                            >
                                + Add Card
                            </Button>
                        )}
                    </Paper>
                ))}
            </Box>

            <Dialog
                open={deleteConfirmOpen}
                onClose={cancelDelete}
            >
                <DialogTitle>Delete Card with Children?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This card has {cardToDelete ? getAllDescendants(cardToDelete).length : 0} child card(s).
                        Deleting this card will also delete all its children. Are you sure you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancel</Button>
                    <Button
                        onClick={() => cardToDelete && confirmDelete(cardToDelete)}
                        color="error"
                        variant="contained"
                    >
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteBoardConfirmOpen}
                onClose={cancelDeleteBoard}
            >
                <DialogTitle>Delete Board with All Cards?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This board contains {boardToDelete ? cards.filter(card => card.boardId === boardToDelete).length : 0} card(s).
                        Deleting this board will permanently delete all cards in it. Are you sure you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDeleteBoard}>Cancel</Button>
                    <Button
                        onClick={() => boardToDelete && confirmDeleteBoard(boardToDelete)}
                        color="error"
                        variant="contained"
                    >
                        Delete Board
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={isCreatingBoard}
                onClose={() => {
                    setBoardTitle('');
                    setBoardColor('#f5f5f5');
                    setIsCreatingBoard(false);
                }}
            >
                <DialogTitle>Create New Board</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        placeholder="Board title"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <Box sx={{ marginTop: '1em' }}>
                        <DialogContentText sx={{ marginBottom: '0.5em', fontSize: '0.9em' }}>
                            Board Color
                        </DialogContentText>
                        <Box sx={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                            {['#f5f5f5', '#ffebee', '#e3f2fd', '#e8f5e9', '#fff3e0', '#f3e5f5', '#fce4ec', '#e0f2f1'].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setBoardColor(color)}
                                    sx={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: color,
                                        border: boardColor === color ? '3px solid #1976d2' : '2px solid #ccc',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setBoardTitle('');
                            setBoardColor('#f5f5f5');
                            setIsCreatingBoard(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateBoard}
                        variant="contained"
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
