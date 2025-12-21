'use client';

import React from 'react';
import Link from 'next/link';
import { CardBox } from '@/modules/shared';
import {
  IconFileUpload,
  IconUsers,
  IconUserPlus,
  IconTableExport,
} from '@tabler/icons-react';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const actions: QuickAction[] = [
  {
    label: 'Importer des leads',
    description: 'CSV ou Excel',
    href: '/import',
    icon: <IconFileUpload size={20} />,
  },
  {
    label: 'Gérer les commerciaux',
    description: 'Utilisateurs et rôles',
    href: '/users',
    icon: <IconUsers size={20} />,
  },
  {
    label: 'Créer un utilisateur',
    description: 'Ajouter un commercial',
    href: '/users?action=create',
    icon: <IconUserPlus size={20} />,
  },
  {
    label: 'Voir tous les leads',
    description: 'Liste complète',
    href: '/leads',
    icon: <IconTableExport size={20} />,
  },
];

export function QuickActions() {
  return (
    <CardBox className="h-full">
      <h5 className="card-title mb-4">Actions rapides</h5>

      <div className="space-y-2">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-darkborder hover:bg-lightgray dark:hover:bg-darkborder/50 hover:border-primary/30 transition-all duration-150 group"
          >
            <span className="dashboard-action-icon group-hover:scale-110 transition-transform">
              {action.icon}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ld group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-darklink">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </CardBox>
  );
}
