export type CkFilterType = 'text' | 'date' | 'select';

export interface CkFilterOption {
    value: string;
    label: string;
}

export interface CkColumnDef {
    key: string;
    label: string;
    sortable?: boolean;
    searchable?: boolean;
    /** Determines which filter widget to show. Defaults to 'text'. */
    filterType?: CkFilterType;
    /** Required when filterType === 'select'. Each label is passed through | translate. */
    filterOptions?: CkFilterOption[];
    width?: string;
}

export type CkSortDir = 'asc' | 'desc' | null;

/** Emitted by (sortChange) when serverSide = true. */
export interface CkSortChange {
    col: string | null;
    dir: CkSortDir;
}

/** A single action rendered in the auto-actions column. */
export interface CkTableAction<T = any> {
    icon: string;
    label: string;
    click: (row: T) => void;
    /** Show as an inline icon button. False → appears in the 3-dots menu. */
    inline?: boolean;
    /** Hide the action for certain rows. */
    visible?: (row: T) => boolean;
    /** Disable the action for certain rows. */
    disabled?: (row: T) => boolean;
    danger?: boolean;
}
