import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Younes', text: 'هل تم حل التمرين؟', time: '10:00' },
    { id: 2, sender: 'أنت', text: 'نعم، لقد أرسلت الحل في المجموعة', time: '10:05' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg = { id: Date.now(), sender: 'أنت', text: newMessage, time: 'الآن' };
    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Simulate response based on the group
    setTimeout(() => {
        const responses = [
            'شكراً على مشاركتك!',
            'فكرة جيدة، سأفكر فيها.',
            'هل يمكنك توضيح أكثر؟',
            'بالتأكيد، سأقوم بذلك.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'عضو في المجموعة', text: randomResponse, time: 'الآن' }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={() => navigate('/chat')}><ArrowLeft /></button>
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <h2 className="font-bold text-lg">مجموعة {id}</h2>
        <button className="ml-auto"><MoreVertical /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'أنت' ? 'justify-end' : ''}`}>
            <div className={`p-3 rounded-lg max-w-[70%] ${msg.sender === 'أنت' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              <p className="text-xs opacity-75">{msg.sender}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 p-2 border rounded-full px-4"
        />
        <button onClick={sendMessage} className="text-blue-600"><Send /></button>
      </div>
    </div>
  );
}
