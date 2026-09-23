'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Filter,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface FilterOption {
  label: string;
  value: string;
}

export interface ColumnDef<T> {
  key?: string;
  accessorKey?: string;
  header: string;
  sortable?: boolean;
  filterOptions?: FilterOption[];
  accessor?: (item: T) => any;
  render?: (item: T, index: number) => React.ReactNode;
  cell?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  wrap?: boolean;
}

export interface BatchAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedItems: T[]) => void;
  variant?: 'primary' | 'danger' | 'default' | 'success';
  disabled?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  id?: string;
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  batchActions?: BatchAction<T>[];
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  dense?: boolean;
}

export function DataTable<T extends { id: string }>({
  id = 'erp-data-table',
  data,
  columns,
  title,
  subtitle,
  searchPlaceholder = 'Filter & search records...',
  searchableKeys,
  batchActions = [],
  primaryAction,
  secondaryAction,
  emptyMessage = 'No records found matching criteria',
  isLoading = false,
  defaultSortKey,
  defaultSortDirection = null,
  dense = false,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Toggle sorting
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection(null);
      setSortKey(null);
    } else {
      setSortDirection('asc');
    }
  };

  // Set filter for a column
  const handleFilterChange = (columnKey: string, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!value || value === 'ALL') {
        delete next[columnKey];
      } else {
        next[columnKey] = value;
      }
      return next;
    });
    setCurrentPage(1);
    setActiveFilterDropdown(null);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
    setSortKey(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  // Filter and Sort Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Column Header Filters
      for (const [colKey, filterVal] of Object.entries(columnFilters)) {
        const col = columns.find((c) => c.key === colKey);
        let rawVal = '';
        if (col?.accessor) {
          rawVal = String(col.accessor(item) ?? '');
        } else {
          rawVal = String((item as any)[colKey] ?? '');
        }
        if (rawVal !== filterVal) {
          return false;
        }
      }

      // 2. Global Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (searchableKeys && searchableKeys.length > 0) {
          return searchableKeys.some((k) => {
            const val = String((item as any)[k] ?? '').toLowerCase();
            return val.includes(q);
          });
        }
        // Fallback: search across all column keys
        return columns.some((col) => {
          const colKey = col.key || col.accessorKey || '';
          let rawVal = '';
          if (col.accessor) {
            rawVal = String(col.accessor(item) ?? '');
          } else if (colKey) {
            rawVal = String((item as any)[colKey] ?? '');
          }
          return rawVal.toLowerCase().includes(q);
        });
      }

      return true;
    });
  }, [data, columns, columnFilters, searchQuery, searchableKeys]);

  // Sorted Data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    const col = columns.find((c) => (c.key || c.accessorKey) === sortKey);
    return [...filteredData].sort((a, b) => {
      let aVal = col?.accessor ? col.accessor(a) : (a as any)[sortKey];
      let bVal = col?.accessor ? col.accessor(b) : (b as any)[sortKey];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal ?? '').toLowerCase();
      const strB = String(bVal ?? '').toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Multi-Select Logic
  const allCurrentPageSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(item.id));
  const someCurrentPageSelected =
    paginatedData.some((item) => selectedIds.has(item.id)) && !allCurrentPageSelected;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        paginatedData.forEach((item) => next.delete(item.id));
      } else {
        paginatedData.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id));
  }, [data, selectedIds]);

  // Export to CSV
  const handleExportCsv = () => {
    const exportItems = selectedItems.length > 0 ? selectedItems : sortedData;
    if (exportItems.length === 0) return;

    const headers = columns.map((c) => c.header).join(',');
    const rows = exportItems.map((item) => {
      return columns
        .map((col) => {
          const colKey = col.key || col.accessorKey || '';
          let val = col.accessor ? col.accessor(item) : colKey ? (item as any)[colKey] : '';
          if (typeof val === 'string' && val.includes(',')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? '';
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFiltersCount =
    Object.keys(columnFilters).length + (searchQuery.trim() ? 1 : 0) + (sortKey ? 1 : 0);

  return (
    <div id={id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200">
        {/* Optional Title Bar (if title or subtitle exists) */}
        {(title || subtitle) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
            <div>
              {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Horizontally Aligned Search & Filter Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left / Center: Search Input + Filters / Secondary Action */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id={`${id}-search-input`}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {secondaryAction}

            {activeFiltersCount > 0 && (
              <button
                id={`${id}-clear-filters-btn`}
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          {/* Right side: Showing items count, Export CSV, Primary Action */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block mr-1">
              Showing <span className="font-semibold text-slate-800">{sortedData.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{data.length}</span> items
            </div>

            <button
              id={`${id}-export-btn`}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export ({selectedItems.length > 0 ? selectedItems.length : sortedData.length})</span>
            </button>

            {primaryAction}
          </div>
        </div>

        {/* Selected Batch Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-600 text-white">
                {selectedIds.size} Selected
              </span>
              <span className="text-xs text-blue-900 font-medium">
                Choose a batch operation to apply across all selected garments records:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {batchActions.map((action, idx) => (
                <button
                  key={idx}
                  id={`${id}-batch-action-${idx}`}
                  disabled={action.disabled}
                  onClick={() => action.onClick(selectedItems)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${
                    action.variant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : action.variant === 'danger'
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : action.variant === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto min-h-[300px] relative">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header with integrated sorting, filtering, and multi-select */}
          <thead className="bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-10">
            <tr>
              {/* Multi-select Header Checkbox */}
              <th className={`${dense ? 'w-8 px-2 py-2' : 'w-10 px-3 py-3'} text-center`}>
                <button
                  id={`${id}-select-all-btn`}
                  onClick={toggleSelectAll}
                  aria-label="Select all visible records"
                  className="text-slate-500 hover:text-blue-600 transition-colors focus:outline-hidden"
                >
                  {allCurrentPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : someCurrentPageSelected ? (
                    <MinusSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </th>

              {/* Column Headers */}
              {columns.map((col, colIdx) => {
                const colKey = col.key || col.accessorKey || `col-${colIdx}`;
                const isSorted = sortKey === colKey;
                const hasActiveFilter = Boolean(columnFilters[colKey]);

                return (
                  <th
                    key={colKey}
                    style={{ width: col.width }}
                    className={`${dense ? 'px-2 py-2 text-[11px]' : 'px-3 py-3'} font-semibold text-slate-700 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5 group relative">
                      {/* Sortable Header Button */}
                      {col.sortable ? (
                        <button
                          id={`${id}-sort-${colKey}`}
                          onClick={() => handleSort(colKey)}
                          className={`inline-flex items-center gap-1 hover:text-blue-600 transition-colors focus:outline-hidden ${
                            isSorted ? 'text-blue-700 font-bold' : ''
                          }`}
                          title={`Sort by ${col.header} (${
                            isSorted ? sortDirection : 'click to sort'
                          })`}
                        >
                          <span>{col.header}</span>
                          <span className="shrink-0">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}

                      {/* Header Filter Dropdown (Multi-select / categorical filter per column) */}
                      {col.filterOptions && col.filterOptions.length > 0 && (
                        <div className="relative inline-block text-left">
                          <button
                            id={`${id}-filter-trigger-${colKey}`}
                            onClick={() =>
                              setActiveFilterDropdown(
                                activeFilterDropdown === colKey ? null : colKey
                              )
                            }
                            className={`p-1 rounded-sm transition-colors ${
                              hasActiveFilter
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-400'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                            }`}
                            title={`Filter by ${col.header}`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>

                          {/* Filter Dropdown Popup */}
                          {activeFilterDropdown === colKey && (
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center justify-between">
                                <span>Filter {col.header}</span>
                                <button
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="max-h-56 overflow-y-auto py-1">
                                <button
                                  onClick={() => handleFilterChange(colKey, 'ALL')}
                                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                    !hasActiveFilter
                                      ? 'text-blue-600 font-semibold bg-blue-50/50'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  <span>All ({data.length})</span>
                                  {!hasActiveFilter && <span className="text-blue-600">✓</span>}
                                </button>

                                {col.filterOptions.map((opt) => {
                                  const isSelected = columnFilters[colKey] === opt.value;
                                  const matchCount = data.filter((item) => {
                                    let raw = col.accessor
                                      ? col.accessor(item)
                                      : (item as any)[colKey];
                                    return String(raw) === opt.value;
                                  }).length;

                                  return (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleFilterChange(colKey, opt.value)}
                                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                        isSelected
                                          ? 'text-blue-600 font-semibold bg-blue-50/50'
                                          : 'text-slate-700'
                                      }`}
                                    >
                                      <span className="truncate mr-2">{opt.label}</span>
                                      <span className="text-[10px] text-slate-400">
                                        ({matchCount})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing QMS live dataset...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">{emptyMessage}</p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Reset search filters to see all records
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    id={`${id}-row-${item.id}`}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 hover:bg-blue-50'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Multi-Select Row Checkbox */}
                    <td className={`${dense ? 'px-2 py-1.5' : 'px-3 py-3'} text-center`}>
                      <button
                        id={`${id}-select-row-${item.id}`}
                        onClick={() => toggleSelectRow(item.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Column Cells */}
                    {columns.map((col, colIdx) => {
                      const colKey = col.key || col.accessorKey || `col-${colIdx}`;
                      return (
                        <td
                          key={colKey}
                          style={col.width ? { width: col.width, maxWidth: col.width } : undefined}
                          className={`${dense ? 'px-2 py-1.5' : 'px-3 py-2.5'} text-slate-700 ${
                            col.wrap || col.className?.includes('whitespace-normal')
                              ? 'whitespace-normal'
                              : 'whitespace-nowrap'
                          } ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          } ${col.className || ''}`}
                        >
                          {col.render
                            ? col.render(item, rowIdx)
                            : col.cell
                            ? col.cell(item, rowIdx)
                            : col.accessor
                            ? col.accessor(item)
                            : (item as any)[colKey]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-5 sm:py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>Rows per page:</span>
          <select
            id={`${id}-pagesize-select`}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id={`${id}-prev-page-btn`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page indicator pills */}
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-md font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            id={`${id}-next-page-btn`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
