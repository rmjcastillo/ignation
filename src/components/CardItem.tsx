import { Paper } from '@mui/material';
import type { Card } from '../models/Card';

interface CardItemProps {
    card: Card;
    onDragStart: (cardId: string) => void;
}

export default function CardItem({ card, onDragStart }: CardItemProps) {
    return (
        <Paper
            draggable
            onDragStart={() => onDragStart(card.id)}
            sx={{
                padding: '0.75em',
                marginBottom: '0.75em',
                backgroundColor: 'white',
                cursor: 'grab',
                '&:active': {
                    cursor: 'grabbing'
                },
                '&:hover': {
                    boxShadow: 3
                }
            }}
        >
            <div style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>
                {card.title}
            </div>
            {card.details && (
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {card.details}
                </div>
            )}
        </Paper>
    );
}
