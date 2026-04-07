import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface AvatarGalleryProps {
  selectedAvatar: string | null;
  onSelect: (url: string, id: string) => void;
}

const avatars = [
  { id: 'b1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', gender: 'male' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', gender: 'male' },
  { id: 'b3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Christian', gender: 'male' },
  { id: 'g1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha', gender: 'female' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi', gender: 'female' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Titi', gender: 'female' },
];

export default function AvatarGallery({ selectedAvatar, onSelect }: AvatarGalleryProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {avatars.map((avatar) => (
          <motion.button
            key={avatar.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(avatar.url, avatar.id)}
            className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
              selectedAvatar === avatar.url 
                ? 'border-blue-600 ring-4 ring-blue-100' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <img 
              src={avatar.url} 
              alt="Avatar" 
              className="w-full h-full object-cover bg-gray-50"
              referrerPolicy="no-referrer"
            />
            {selectedAvatar === avatar.url && (
              <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                  <Check size={16} />
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
