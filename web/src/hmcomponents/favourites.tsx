import { useEffect, useState } from 'react';
import {
  subscribeFavourites,
  markFavourite,
  unmarkFavourite,
  getFavourites,
} from '../../src/services/favouritesService';

interface FavouriteButtonProps {
  channelId: string | undefined;
}

export const FavouriteButton: React.FC<FavouriteButtonProps> = ({ channelId }) => {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    const id = Number(channelId);
    setIsFav(getFavourites().has(id));
    return subscribeFavourites((ids: ReadonlySet<number>) => setIsFav(ids.has(id)));
  }, [channelId]);

  const toggle = () => {
    if (!channelId) return;
    const id = Number(channelId);
    isFav ? unmarkFavourite(id) : markFavourite(id);
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer
        text-black/40 dark:text-white/35
        hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10
        transition-all duration-150"
      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '20px',
          color: isFav ? '#f97316' : undefined,
          fontVariationSettings: isFav
            ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          transition: 'color 0.15s, font-variation-settings 0.15s',
        }}
      >
        star
      </span>
    </button>
  );
};