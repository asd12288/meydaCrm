'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconSpeakerphone,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconUsers,
  IconShieldCheck,
} from '@tabler/icons-react';
import {
  CardBox,
  Spinner,
  EmptyState,
  useToast,
  ConfirmDialog,
  Badge,
} from '@/modules/shared';
import { Button } from '@/components/ui/button';
import {
  getAllBanners,
  toggleBannerActive,
  deleteBanner,
  type SystemBanner,
  type BannerType,
} from '../lib/banner-actions';
import { CreateBannerModal } from './create-banner-modal';
import { EditBannerModal } from './edit-banner-modal';

const TYPE_ICONS: Record<BannerType, React.ReactNode> = {
  info: <IconInfoCircle size={16} className="text-blue-500" />,
  warning: <IconAlertTriangle size={16} className="text-amber-500" />,
  success: <IconCircleCheck size={16} className="text-green-500" />,
  announcement: <IconSpeakerphone size={16} className="text-primary" />,
};

const TYPE_LABELS: Record<BannerType, string> = {
  info: 'Information',
  warning: 'Avertissement',
  success: 'Succès',
  announcement: 'Annonce',
};

export function BannerManagement() {
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBanner, setEditBanner] = useState<SystemBanner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<SystemBanner | null>(null);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getAllBanners();
    if (result.error) {
      setError(result.error);
    } else {
      setBanners(result.banners || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch on mount pattern
    fetchBanners();
  }, []);

  const handleToggleActive = (banner: SystemBanner) => {
    startTransition(async () => {
      const result = await toggleBannerActive(banner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.isActive ? 'Annonce activée' : 'Annonce désactivée');
        fetchBanners();
      }
    });
  };

  const handleDelete = () => {
    if (!deletingBanner) return;

    startTransition(async () => {
      const result = await deleteBanner(deletingBanner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Annonce supprimée');
        fetchBanners();
      }
      setDeletingBanner(null);
    });
  };

  if (isLoading) {
    return (
      <CardBox>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </CardBox>
    );
  }

  if (error) {
    return (
      <CardBox>
        <div className="text-center py-8 text-red-500">{error}</div>
      </CardBox>
    );
  }

  return (
    <>
      <CardBox>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconSpeakerphone size={20} className="text-primary" />
            <h3 className="card-title">Annonces système</h3>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <IconPlus size={16} />
            <span>Nouvelle annonce</span>
          </Button>
        </div>

        {banners.length === 0 ? (
          <EmptyState
            icon={<IconSpeakerphone size={48} />}
            title="Aucune annonce"
            description="Créez une annonce pour informer les utilisateurs."
          />
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`p-4 rounded-lg border ${
                  banner.is_active
                    ? 'bg-white dark:bg-dark border-border'
                    : 'bg-gray-50 dark:bg-darkgray border-gray-200 dark:border-darkborder opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {TYPE_ICONS[banner.type]}
                      <span className="text-sm font-medium text-darklink">
                        {TYPE_LABELS[banner.type]}
                      </span>
                      <span className="text-darklink">•</span>
                      {banner.target_audience === 'all' ? (
                        <Badge variant="secondary" size="sm">
                          <IconUsers size={12} className="mr-1" />
                          Tous
                        </Badge>
                      ) : (
                        <Badge variant="primary" size="sm">
                          <IconShieldCheck size={12} className="mr-1" />
                          Admins
                        </Badge>
                      )}
                      {!banner.is_active && (
                        <Badge variant="error" size="sm">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-ld">{banner.message}</p>
                    <div className="mt-2 text-xs text-darklink">
                      Créée le {new Date(banner.created_at).toLocaleDateString('fr-FR')}
                      {banner.creator?.display_name && (
                        <span> par {banner.creator.display_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      disabled={isPending}
                      className="btn-circle-hover"
                      title={banner.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {banner.is_active ? (
                        <IconToggleRight size={18} className="text-green-500" />
                      ) : (
                        <IconToggleLeft size={18} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditBanner(banner)}
                      className="btn-circle-hover"
                      title="Modifier"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingBanner(banner)}
                      className="btn-circle-hover text-red-500 hover:text-red-600"
                      title="Supprimer"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBox>

      {/* Create Modal */}
      <CreateBannerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchBanners}
      />

      {/* Edit Modal */}
      <EditBannerModal
        isOpen={!!editBanner}
        onClose={() => setEditBanner(null)}
        onSuccess={fetchBanners}
        banner={editBanner}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBanner}
        onClose={() => setDeletingBanner(null)}
        onConfirm={handleDelete}
        title="Supprimer l'annonce"
        message="Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        isPending={isPending}
      />
    </>
  );
}
