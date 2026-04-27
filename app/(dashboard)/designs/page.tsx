'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Palette } from 'lucide-react';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { CreateDesignButton } from '@/components/features/designs/dialogs/create-design-button';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { DesignsSkeleton } from '@/components/skeletons/designs-skeleton';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { toast } from 'sonner';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { useDesigns } from '@/lib/hooks/use-designs';
import { useDesignsFilters } from '@/lib/hooks/use-designs-filters';
import { useDesignsTable } from '@/lib/hooks/use-designs-table';
import { DesignsFilters } from '@/components/features/designs/designs-filters';
import { DesignsTable } from '@/components/features/designs/designs-table';

// Wrapper component para Suspense boundary requerido por useSearchParams
export default function DesignsPage() {
  return (
    <Suspense fallback={<DesignsSkeleton />}>
      <DesignsPageContent />
    </Suspense>
  );
}

function DesignsPageContent() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estado para el panel de detalles
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Estado para el diálogo de confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<Design | null>(null);

  const { designers } = useDesigners();
  const filters = useDesignsFilters();

  // Leer query param ?open para abrir diseño automáticamente
  const searchParams = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      setSelectedDesignId(openId);
      setDetailSheetOpen(true);
    }
  }, [searchParams]);

  // SWR Hook for fetching designs
  const { items, isLoading, error, mutate } = useDesigns({
    weekStart: filters.weekStartFilter,
    weekEnd: filters.weekEndFilter,
    statusFilter: filters.statusFilter,
    designerFilter: filters.designerFilter,
  });

  // Local state for optimistic updates
  const [localItems, setLocalItems] = useState<Design[]>([]);

  // Sync SWR data with local state
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // NOTE: We intentionally avoid clearing localItems on filter changes.
  // Logs proved this could run after SWR sync and wipe valid data for the new range.

  // Show toast when revalidation fails (even if we have cached data)
  useEffect(() => {
    if (error) {
      toast.error('No se pudieron actualizar los datos. Revisa la conexión e inténtalo de nuevo.');
    }
  }, [error]);

  // Filtrar items localmente basado en searchQuery (usando debounced)
  const filteredItems = useMemo(() => {
    const query = filters.debouncedSearchQuery.toLowerCase();
    if (!query) return localItems;
    return localItems.filter((design) =>
      design.title.toLowerCase().includes(query) ||
      design.player.toLowerCase().includes(query) ||
      design.match_home.toLowerCase().includes(query) ||
      design.match_away.toLowerCase().includes(query)
    );
  }, [localItems, filters.debouncedSearchQuery]);

  const table = useDesignsTable(filteredItems);

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setEditDialogOpen(true);
  };

  const handleDelete = (design: Design) => {
    if (!isAdmin) {
      toast.error('Solo administradores pueden eliminar diseños');
      return;
    }
    setDesignToDelete(design);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;

    setDeletingId(designToDelete.id);
    try {
      const response = await fetch(`/api/designs/${designToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar diseño');
      }

      toast.success('Diseño eliminado exitosamente');
      setDeleteConfirmOpen(false);
      setDesignToDelete(null);
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar diseño');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingDesign(null);
  };

  const handleOpenDetail = (designId: string) => {
    setSelectedDesignId(designId);
    setDetailSheetOpen(true);
  };

  // Error state se maneja fuera del PageTransition cuando no hay datos cacheados
  if (error && localItems.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error al cargar diseños"
          description={error.message}
          actionLabel="Reintentar"
          onAction={() => mutate()}
        />
      </div>
    );
  }

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = isLoading && localItems.length === 0;
  const searchQueryActive = !!filters.debouncedSearchQuery;

  return (
    <DashboardPage
      title="Diseños"
      icon={Palette}
      subtitle="Gestión de todas las piezas gráficas"
      loading={showSkeleton}
      skeleton={<DesignsSkeleton />}
      actions={
        <CreateDesignButton
          onDesignCreated={() => mutate()}
          disabled={!isAdmin}
          disabledReason="Solo administradores pueden crear diseños"
          activeWeekStart={filters.weekStartFilter}
          activeWeekEnd={filters.weekEndFilter}
        />
      }
    >
      <DesignsFilters
        searchQuery={filters.searchQuery}
        onSearchQueryChange={filters.setSearchQuery}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        designerFilter={filters.designerFilter}
        onDesignerFilterChange={filters.setDesignerFilter}
        weekStartFilter={filters.weekStartFilter}
        onWeekStartChange={filters.setWeekStartFilter}
        weekEndFilter={filters.weekEndFilter}
        onWeekEndChange={filters.setWeekEndFilter}
        designers={designers}
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          title={searchQueryActive ? 'No se encontraron resultados' : 'No hay diseños programados'}
          description={searchQueryActive ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer diseño para comenzar'}
          actionLabel={searchQueryActive ? 'Limpiar búsqueda' : 'Crear Diseño'}
          onAction={() => {
            if (searchQueryActive) {
              filters.setSearchQuery('');
            } else {
              if (!isAdmin) return;
              setEditingDesign(null);
              setEditDialogOpen(true);
            }
          }}
          actionDisabled={!isAdmin && !searchQueryActive}
          actionDisabledReason={!isAdmin && !searchQueryActive ? 'Solo administradores pueden crear diseños' : undefined}
        />
      ) : (
        <DesignsTable
          paginatedItems={table.paginatedItems}
          designers={designers}
          totalItems={table.totalItems}
          totalUnfilteredCount={localItems.length}
          searchQueryActive={searchQueryActive}
          itemsPerPage={table.itemsPerPage}
          currentPage={table.currentPage}
          totalPages={table.totalPages}
          startIndex={table.startIndex}
          endIndex={table.endIndex}
          sortColumn={table.sortColumn}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          onItemsPerPageChange={(n) => {
            table.setItemsPerPage(n);
            table.setCurrentPage(1);
          }}
          onPageChange={table.setCurrentPage}
          onOpenDetail={handleOpenDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
          deletingId={deletingId}
        />
      )}

      <CreateDesignDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onDesignCreated={() => mutate()}
        design={editingDesign}
        activeWeekStart={filters.weekStartFilter}
        activeWeekEnd={filters.weekEndFilter}
      />

      <DesignDetailSheet
        designId={selectedDesignId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onDesignUpdated={() => mutate()}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setDesignToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar diseño"
        description={designToDelete ? `¿Estás seguro de que quieres eliminar "${designToDelete.title}"? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deletingId !== null}
      />
    </DashboardPage>
  );
}
