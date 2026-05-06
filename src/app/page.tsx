'use client';
import { useState, useEffect } from 'react';
import { Trip } from '@/lib/types';
import { tripsStorage } from '@/lib/storage';
import { getRandomGlobeImage, DEFAULT_GLOBE_IMAGE } from '@/lib/utils';
import { TripCard } from '@/components/trips/TripCard';
import { TripForm } from '@/components/trips/TripForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BackupRestore } from '@/components/BackupRestore';
import { UserMenu } from '@/components/auth/UserMenu';
import { MigrateLocalDataBanner } from '@/components/auth/MigrateLocalDataBanner';
import { Plus, Globe, Compass } from 'lucide-react';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  // Start with the stable default so SSR and the first client render match,
  // then randomize after mount to keep the homepage feeling fresh.
  const [heroImage, setHeroImage] = useState(DEFAULT_GLOBE_IMAGE);
  const [showCreate, setShowCreate] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setHeroImage(getRandomGlobeImage());
  }, []);

  useEffect(() => {
    let cancelled = false;
    tripsStorage.getAll().then(items => { if (!cancelled) setTrips(items); });
    return () => { cancelled = true; };
  }, []);

  const refreshHero = () => setHeroImage(getRandomGlobeImage());

  const handleCreate = async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const trip = await tripsStorage.create(data);
    setTrips(prev => [...prev, trip]);
    setShowCreate(false);
  };

  const handleEdit = async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editTrip) return;
    const updated = await tripsStorage.update(editTrip.id, data);
    if (updated) setTrips(prev => prev.map(t => t.id === editTrip.id ? updated : t));
    setEditTrip(null);
  };

  const handleDelete = async (id: string) => {
    await tripsStorage.delete(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const handleRestored = async () => {
    setTrips(await tripsStorage.getAll());
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero Section */}
      <div className="relative h-[280px] sm:h-[380px] md:h-[500px] overflow-hidden">
        {heroImage && (
          <img
            src={heroImage}
            alt="globe"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        {/* User menu — top-left in RTL */}
        <div className="absolute top-3 left-3 z-10">
          <UserMenu />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">TripPlan</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl mb-5 sm:mb-8 max-w-md leading-relaxed">
            תכנן את הטיול המושלם שלך — טיסות, מלונות, מסעדות ועוד
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={() => setShowCreate(true)}
              className="bg-white text-indigo-700 hover:bg-gray-50 shadow-xl px-6 sm:px-8"
            >
              <Plus className="w-5 h-5" />
              צור טיול חדש
            </Button>
            <button
              onClick={refreshHero}
              className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm min-w-[44px] min-h-[44px]"
              title="שנה תמונה"
              aria-label="שנה תמונה"
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <MigrateLocalDataBanner onDone={handleRestored} />
        {trips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Compass className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">עדיין אין טיולים</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              התחל לתכנן את ההרפתקה הבאה שלך. כל הפרטים יישמרו אוטומטית במכשיר שלך.
            </p>
            <Button size="lg" onClick={() => setShowCreate(true)}>
              <Plus className="w-5 h-5" />
              צור את הטיול הראשון שלך
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">הטיולים שלי ({trips.length})</h2>
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="w-4 h-4" />
                טיול חדש
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {trips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onEdit={(t) => setEditTrip(t)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Backup / Restore */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-10">
        <div className="border-t border-gray-200 pt-6">
          <BackupRestore onRestored={handleRestored} />
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="צור טיול חדש">
        <TripForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editTrip} onClose={() => setEditTrip(null)} title="עריכת טיול">
        {editTrip && <TripForm initialData={editTrip} onSubmit={handleEdit} onCancel={() => setEditTrip(null)} />}
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="מחיקת טיול" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600">האם אתה בטוח שברצונך למחוק את הטיול? פעולה זו אינה הפיכה.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteConfirm!)}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
