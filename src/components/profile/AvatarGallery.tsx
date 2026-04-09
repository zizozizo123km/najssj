import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface AvatarGalleryProps {
  selectedAvatar: string | null;
  onSelect: (url: string, id: string) => void;
}

const avatars = [
  { id: 'yhip0pgxiplixjvmphmn', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/yhip0pgxiplixjvmphmn', gender: 'male' },
  { id: 'tykcejevjdefrdntffv6', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/tykcejevjdefrdntffv6', gender: 'male' },
  { id: 'csf3tghabjutixnqvnff', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/csf3tghabjutixnqvnff', gender: 'male' },
  { id: 'ojctwpwfscrx90faosxk', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/ojctwpwfscrx90faosxk', gender: 'male' },
  { id: 'qo14ohwu63usjw1mrokb', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/qo14ohwu63usjw1mrokb', gender: 'male' },
  { id: 'qbjp2ckvwy6zusiqu95i', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/qbjp2ckvwy6zusiqu95i', gender: 'male' },
  { id: 'tsv5rgkqoddmudbudxgd', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/tsv5rgkqoddmudbudxgd', gender: 'male' },
  { id: 'zu5tbmb5ulnf13aj2urs', url: 'https://res.cloudinary.com/dbmokwazr/image/upload/zu5tbmb5ulnf13aj2urs', gender: 'male' },
];

export default function AvatarGallery({ selectedAvatar, onSelect }: AvatarGalleryProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
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
