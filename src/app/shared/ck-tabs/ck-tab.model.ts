export interface CkTab {
    /** Unique identifier — used for active comparison and (activeChange) emission */
    key: string;
    /** Translation key or plain display string */
    label: string;
    /** Material Symbols icon name (optional) */
    icon?: string;
    /** Number shown as a small badge on the tab (0 / null hides it) */
    badge?: number | null;
}
