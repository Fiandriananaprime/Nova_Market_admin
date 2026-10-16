export interface Category {
    id: string,
    name: string,
    count?: number,
    parentId?: string | null,
    children? : Category[]
}