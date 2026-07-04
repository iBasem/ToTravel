import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    // Show up to 5 page buttons centered around current page
    const getPageNumbers = () => {
        const pages: number[] = [];
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <nav className="pkg-pagination" aria-label={t('ui.pagination', 'Pagination')}>
            <button
                className="pkg-pagination-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label={t('ui.previousPage')}
            >
                <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((page) => (
                <button
                    key={page}
                    className={`pkg-pagination-btn${page === currentPage ? ' active' : ''}`}
                    onClick={() => onPageChange(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page}
                </button>
            ))}

            <button
                className="pkg-pagination-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label={t('ui.nextPage')}
            >
                <ChevronRight size={16} />
            </button>
        </nav>
    );
}
