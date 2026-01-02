import { Button } from '@mui/material';
import './app.css'
import { useState } from 'react';
import type { Workspace } from '../workpace/Workspace';


export default function App(){
    
    const [workspaces, setworkspaces] = useState<Workspace[]| undefined>([]);


    return <>
    <div className='app-container'>
        <aside className='app-aside'>
            <header className='app-title'>IGNITION</header>
            <Button variant="contained" className='add-workspace'  sx={{ marginLeft: 'auto' , marginRight:'1em'}} >Create Workspace</Button>
            
        </aside>
        <div className='app-playground'>
            
        </div>
    </div>
    </>;
}