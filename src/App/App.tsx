import { Button, TextField, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import './app.css'
import { useState, useEffect } from 'react';
import type { Workspace } from '../workpace/Workspace';
import BoardList from '../components/BoardList';

const WORKSPACES_STORAGE_KEY = 'kanban_workspaces';
const SELECTED_WORKSPACE_STORAGE_KEY = 'kanban_selected_workspace';

export default function App(){

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
        e.stopPropagation();
        setEditingWorkspaceId(workspace.id);
        setEditingWorkspaceName(workspace.name);
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
                            <ListItemButton
                                onClick={() => handleSelectWorkspace(workspace)}
                                sx={{
                                    color: 'white',
                                    paddingRight: '1em',
                                    justifyContent: 'flex-end',
                                    backgroundColor: selectedWorkspace?.id === workspace.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
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
                        )}
                    </ListItem>
                ))}
            </List>

        </aside>
        <div className='app-playground'>
            {selectedWorkspace && (
                <div style={{ padding: '2em' }}>
                    <h2 style={{ margin: '0 0 1em 0', color: '#333' }}>
                        {selectedWorkspace.name}
                    </h2>
                    <BoardList workspaceId={selectedWorkspace.id} />
                </div>
            )}
        </div>
    </div>
    </>;
}