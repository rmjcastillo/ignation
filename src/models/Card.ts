export type CardStatus = 'todo' | 'doing' | 'done' | 'blocked' | '';

export interface Card{
    id:string;
    boardId : string;
    workspaceId: string;
    title: string;
    details: string ;
    parentId : string | null | undefined;
    dateCreated : Date;
    dueDate : Date | null | undefined;
    status: CardStatus;
}