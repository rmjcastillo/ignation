import { Button, TextField, List, ListItem, ListItemButton, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './app.css'
import { useState, useEffect, useRef } from 'react';
import type { Workspace } from '../workpace/Workspace';
import BoardList, { type BoardListRef } from '../components/BoardList';

const WORKSPACES_STORAGE_KEY = 'kanban_workspaces';
const SELECTED_WORKSPACE_STORAGE_KEY = 'kanban_selected_workspace';

export default function App(){
    const boardListRef = useRef<BoardListRef>(null);

    const [workspaces, setworkspaces] = useState<Workspace[]>(() => {
        const saved = localStorage.getItem(WORKSPACES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [isCreating, setIsCreating] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(() => {
        const saved = localStorage.getItem(SELECTED_WORKSPACE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);
    const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
    const [hoveredWorkspaceId, setHoveredWorkspaceId] = useState<number | null>(null);
    const [deleteWorkspaceConfirmOpen, setDeleteWorkspaceConfirmOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<number | null>(null);
    const [isEditingPlaygroundTitle, setIsEditingPlaygroundTitle] = useState(false);
    const [playgroundTitleValue, setPlaygroundTitleValue] = useState('');

    useEffect(() => {
        localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    }, [workspaces]);

    useEffect(() => {
        if (selectedWorkspace) {
            localStorage.setItem(SELECTED_WORKSPACE_STORAGE_KEY, JSON.stringify(selectedWorkspace));
        } else {
            localStorage.removeItem(SELECTED_WORKSPACE_STORAGE_KEY);
        }
    }, [selectedWorkspace]);

    const handleCreateWorkspace = () => {
        setIsCreating(true);
    };

    const handleSelectWorkspace = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
    };

    const handleSaveWorkspace = () => {
        if (workspaceName.trim()) {
            const newWorkspace: Workspace = {
                id: Date.now(),
                name: workspaceName,
                order: workspaces.length + 1
            };
            setworkspaces([...workspaces, newWorkspace]);
            setWorkspaceName('');
            setIsCreating(false);
        }
    };

    const handleCancelCreate = () => {
        setWorkspaceName('');
        setIsCreating(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveWorkspace();
        } else if (e.key === 'Escape') {
            handleCancelCreate();
        }
    };

    const handleWorkspaceNameClick = (workspace: Workspace, e: React.MouseEvent) => {
        // Only allow editing if the workspace is already selected
        if (selectedWorkspace && selectedWorkspace.id === workspace.id) {
            e.stopPropagation();
            setEditingWorkspaceId(workspace.id);
            setEditingWorkspaceName(workspace.name);
        }
    };

    const handleSaveWorkspaceName = () => {
        if (editingWorkspaceName.trim() && editingWorkspaceId !== null) {
            const updatedWorkspaces = workspaces.map(ws =>
                ws.id === editingWorkspaceId
                    ? { ...ws, name: editingWorkspaceName }
                    : ws
            );
            setworkspaces(updatedWorkspaces);

            // Update selected workspace if it's the one being edited
            if (selectedWorkspace && selectedWorkspace.id === editingWorkspaceId) {
                setSelectedWorkspace({ ...selectedWorkspace, name: editingWorkspaceName });
            }

            setEditingWorkspaceId(null);
            setEditingWorkspaceName('');
        }
    };

    const handleCancelWorkspaceEdit = () => {
        setEditingWorkspaceId(null);
        setEditingWorkspaceName('');
    };

    const handleWorkspaceNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveWorkspaceName();
        } else if (e.key === 'Escape') {
            handleCancelWorkspaceEdit();
        }
    };

    const handleDeleteWorkspace = (workspaceId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setWorkspaceToDelete(workspaceId);
        setDeleteWorkspaceConfirmOpen(true);
    };

    const confirmDeleteWorkspace = () => {
        if (workspaceToDelete !== null) {
            // Remove workspace from list
            setworkspaces(workspaces.filter(ws => ws.id !== workspaceToDelete));

            // If deleted workspace was selected, clear selection
            if (selectedWorkspace && selectedWorkspace.id === workspaceToDelete) {
                setSelectedWorkspace(null);
            }

            // Delete all boards and cards associated with this workspace from localStorage
            const boardsKey = 'kanban_boards';
            const cardsKey = 'kanban_cards';

            const savedBoards = localStorage.getItem(boardsKey);
            if (savedBoards) {
                const allBoards = JSON.parse(savedBoards);
                const filteredBoards = allBoards.filter((board: any) =>
                    board.workspaceId !== workspaceToDelete.toString()
                );
                localStorage.setItem(boardsKey, JSON.stringify(filteredBoards));
            }

            const savedCards = localStorage.getItem(cardsKey);
            if (savedCards) {
                const allCards = JSON.parse(savedCards);
                const filteredCards = allCards.filter((card: any) =>
                    card.workspaceId !== workspaceToDelete.toString()
                );
                localStorage.setItem(cardsKey, JSON.stringify(filteredCards));
            }

            setDeleteWorkspaceConfirmOpen(false);
            setWorkspaceToDelete(null);
        }
    };

    const cancelDeleteWorkspace = () => {
        setDeleteWorkspaceConfirmOpen(false);
        setWorkspaceToDelete(null);
    };

    const handlePlaygroundTitleClick = () => {
        if (selectedWorkspace) {
            setIsEditingPlaygroundTitle(true);
            setPlaygroundTitleValue(selectedWorkspace.name);
        }
    };

    const handleSavePlaygroundTitle = () => {
        if (playgroundTitleValue.trim() && selectedWorkspace) {
            const updatedWorkspaces = workspaces.map(ws =>
                ws.id === selectedWorkspace.id
                    ? { ...ws, name: playgroundTitleValue }
                    : ws
            );
            setworkspaces(updatedWorkspaces);
            setSelectedWorkspace({ ...selectedWorkspace, name: playgroundTitleValue });
            setIsEditingPlaygroundTitle(false);
            setPlaygroundTitleValue('');
        }
    };

    const handleCancelPlaygroundTitleEdit = () => {
        setIsEditingPlaygroundTitle(false);
        setPlaygroundTitleValue('');
    };

    const handlePlaygroundTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSavePlaygroundTitle();
        } else if (e.key === 'Escape') {
            handleCancelPlaygroundTitleEdit();
        }
    };

    return <>
    <div className='app-container'>
        <aside className='app-aside'>
            <header className='app-title'>IGNITION</header>
            <Button
                variant="contained"
                className='add-workspace'
                sx={{ marginLeft: 'auto' , marginRight:'1em'}}
                onClick={handleCreateWorkspace}
            >
                Create Workspace
            </Button>

            {isCreating && (
                <div style={{
                    marginLeft: 'auto',
                    marginRight: '1em',
                    marginTop: '1em',
                    display: 'flex',
                    gap: '0.5em'
                }}>
                    <TextField
                        autoFocus
                        size="small"
                        placeholder="Workspace name"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        sx={{ backgroundColor: 'white', borderRadius: '4px' }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveWorkspace}
                    >
                        Save
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelCreate}
                        sx={{ color: 'white', borderColor: 'white' }}
                    >
                        Cancel
                    </Button>
                </div>
            )}

            <List sx={{ width: '100%', marginTop: '2em' }}>
                {workspaces.map((workspace) => (
                    <ListItem
                        key={workspace.id}
                        disablePadding
                        onMouseEnter={() => setHoveredWorkspaceId(workspace.id)}
                        onMouseLeave={() => setHoveredWorkspaceId(null)}
                        sx={{ position: 'relative' }}
                    >
                        {editingWorkspaceId === workspace.id ? (
                            <div style={{
                                width: '100%',
                                padding: '8px 1em 8px 8px',
                                display: 'flex',
                                justifyContent: 'flex-end'
                            }}>
                                <TextField
                                    autoFocus
                                    size="small"
                                    value={editingWorkspaceName}
                                    onChange={(e) => setEditingWorkspaceName(e.target.value)}
                                    onBlur={handleSaveWorkspaceName}
                                    onKeyDown={handleWorkspaceNameKeyDown}
                                    sx={{
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        '& .MuiInputBase-input': {
                                            textAlign: 'right',
                                            padding: '6px 8px'
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <ListItemButton
                                    onClick={() => handleSelectWorkspace(workspace)}
                                    sx={{
                                        color: 'white',
                                        paddingRight: hoveredWorkspaceId === workspace.id ? '3em' : '1em',
                                        justifyContent: 'flex-end',
                                        backgroundColor: selectedWorkspace?.id === workspace.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                        transition: 'padding-right 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={workspace.name}
                                        onClick={(e) => handleWorkspaceNameClick(workspace, e)}
                                        sx={{
                                            textAlign: 'right',
                                            cursor: 'text',
                                            '&:hover': {
                                                opacity: 0.8
                                            }
                                        }}
                                    />
                                </ListItemButton>
                                {hoveredWorkspaceId === workspace.id && !editingWorkspaceId && (
                                    <IconButton
                                        onClick={(e) => handleDeleteWorkspace(workspace.id, e)}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            padding: '4px',
                                            color: 'white',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                    </ListItem>
                ))}
            </List>

        </aside>
        <div className='app-playground'>
            {selectedWorkspace && (
                <div style={{ padding: '2em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em' }}>
                        {isEditingPlaygroundTitle ? (
                            <TextField
                                autoFocus
                                size="small"
                                value={playgroundTitleValue}
                                onChange={(e) => setPlaygroundTitleValue(e.target.value)}
                                onBlur={handleSavePlaygroundTitle}
                                onKeyDown={handlePlaygroundTitleKeyDown}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '1.5em',
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '4px 8px'
                                    }
                                }}
                            />
                        ) : (
                            <h2
                                style={{
                                    margin: '0',
                                    color: '#333',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={handlePlaygroundTitleClick}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                {selectedWorkspace.name}
                            </h2>
                        )}
                        <Button
                            variant="contained"
                            onClick={() => boardListRef.current?.openCreateBoardDialog()}
                        >
                            Add Board
                        </Button>
                    </div>
                    <BoardList ref={boardListRef} workspaceId={selectedWorkspace.id} />
                </div>
            )}
        </div>

        <Dialog
            open={deleteWorkspaceConfirmOpen}
            onClose={cancelDeleteWorkspace}
        >
            <DialogTitle>Delete Workspace?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete this workspace? This will permanently delete all boards and cards in this workspace. This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelDeleteWorkspace}>Cancel</Button>
                <Button
                    onClick={confirmDeleteWorkspace}
                    color="error"
                    variant="contained"
                >
                    Delete Workspace
                </Button>
            </DialogActions>
        </Dialog>
    </div>
    </>;
}